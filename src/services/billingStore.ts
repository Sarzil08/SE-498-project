import * as SQLite from 'expo-sqlite';
import { DeviceEventEmitter } from 'react-native';
import { supabase } from '../../supabaseClient';

export const BILLING_WALLET_UPDATED_EVENT = 'car_rescue_bd_billing_wallet_updated';
export const PLATFORM_COMMISSION_RATE = 0.10;
export const MECHANIC_MIN_ACTIVE_WALLET = 100;
export const DEFAULT_MECHANIC_WALLET = 1000;

export type PaymentMethod = 'bkash' | 'nagad' | 'card' | 'cash';

export interface MechanicWallet {
  mechanicId: string;
  balance: number;
  blocked: boolean;
  source?: 'supabase' | 'local';
}

export interface PaymentRecordInput {
  requestId: string;
  mechanicId: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  commissionRate?: number;
}

export interface PaymentRecordResult {
  success: boolean;
  alreadyRecorded?: boolean;
  totalAmount: number;
  commission: number;
  mechanicEarning: number;
  walletDeducted: number;
  walletBalanceAfter: number;
  paymentMethod: PaymentMethod;
  source?: 'supabase' | 'local';
}

const db = SQLite.openDatabaseSync('car_rescue_billing.db');
let initialized = false;

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function emitWallet(wallet: MechanicWallet) {
  DeviceEventEmitter.emit(BILLING_WALLET_UPDATED_EVENT, wallet);
}

function isMissingRpcError(error: any) {
  const message = String(error?.message || '').toLowerCase();
  const code = String(error?.code || '').toLowerCase();
  return code === 'pgrst202' || code === '42883' || message.includes('could not find the function') || message.includes('does not exist');
}

export function initBillingDatabase() {
  if (initialized) return;
  db.execSync(`
    CREATE TABLE IF NOT EXISTS mechanic_wallets (
      mechanic_id TEXT PRIMARY KEY NOT NULL,
      balance REAL NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS service_payment_ledger (
      id TEXT PRIMARY KEY NOT NULL,
      request_id TEXT NOT NULL UNIQUE,
      mechanic_id TEXT NOT NULL,
      amount REAL NOT NULL,
      commission REAL NOT NULL,
      payment_method TEXT NOT NULL,
      wallet_deducted REAL NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  initialized = true;
}

export function getMechanicWalletSync(mechanicId: string, defaultBalance = DEFAULT_MECHANIC_WALLET): MechanicWallet {
  initBillingDatabase();
  const row = db.getFirstSync<{ mechanic_id: string; balance: number }>(
    'SELECT mechanic_id, balance FROM mechanic_wallets WHERE mechanic_id = ? LIMIT 1',
    [mechanicId],
  );

  if (!row) {
    const now = new Date().toISOString();
    db.runSync(
      'INSERT INTO mechanic_wallets (mechanic_id, balance, updated_at) VALUES (?, ?, ?)',
      [mechanicId, defaultBalance, now],
    );
    return { mechanicId, balance: defaultBalance, blocked: defaultBalance <= MECHANIC_MIN_ACTIVE_WALLET, source: 'local' };
  }

  const balance = Number(row.balance) || 0;
  return { mechanicId, balance, blocked: balance <= MECHANIC_MIN_ACTIVE_WALLET, source: 'local' };
}

/**
 * Shared wallet lookup. It uses the Supabase RPC when the billing migration
 * has been deployed, and falls back to the device-local wallet for demo mode.
 */
export async function getMechanicWallet(mechanicId: string): Promise<MechanicWallet> {
  try {
    const { data, error } = await supabase.rpc('get_mechanic_wallet', { p_mechanic_id: mechanicId });
    if (!error && data) {
      const row = Array.isArray(data) ? data[0] : data;
      const balance = Number(row?.balance ?? DEFAULT_MECHANIC_WALLET);
      return { mechanicId, balance, blocked: balance <= MECHANIC_MIN_ACTIVE_WALLET, source: 'supabase' };
    }
    if (error && !isMissingRpcError(error)) throw error;
  } catch (error) {
    if (!isMissingRpcError(error)) {
      console.log('Shared mechanic wallet unavailable, using local fallback:', error);
    }
  }
  return getMechanicWalletSync(mechanicId);
}

export function isMechanicBlocked(balance: number) {
  return Number(balance) <= MECHANIC_MIN_ACTIVE_WALLET;
}

export async function rechargeMechanicWallet(mechanicId: string, amount: number): Promise<MechanicWallet> {
  const rechargeAmount = roundMoney(Number(amount));
  if (!Number.isFinite(rechargeAmount) || rechargeAmount <= 0) {
    throw new Error('Recharge amount must be greater than 0.');
  }

  try {
    const { data, error } = await supabase.rpc('recharge_mechanic_wallet', {
      p_mechanic_id: mechanicId,
      p_amount: rechargeAmount,
    });

    if (!error && data) {
      const row = Array.isArray(data) ? data[0] : data;
      const balance = Number(row?.balance ?? 0);
      const wallet = { mechanicId, balance, blocked: balance <= MECHANIC_MIN_ACTIVE_WALLET, source: 'supabase' as const };
      emitWallet(wallet);
      return wallet;
    }
    if (error && !isMissingRpcError(error)) throw error;
  } catch (error) {
    if (!isMissingRpcError(error)) throw error;
  }

  const current = getMechanicWalletSync(mechanicId);
  const nextBalance = roundMoney(current.balance + rechargeAmount);
  db.runSync(
    'UPDATE mechanic_wallets SET balance = ?, updated_at = ? WHERE mechanic_id = ?',
    [nextBalance, new Date().toISOString(), mechanicId],
  );
  const wallet = { mechanicId, balance: nextBalance, blocked: isMechanicBlocked(nextBalance), source: 'local' as const };
  emitWallet(wallet);
  return wallet;
}

export function calculateCommission(totalAmount: number, commissionRate = PLATFORM_COMMISSION_RATE) {
  return roundMoney(Math.max(0, Number(totalAmount)) * commissionRate);
}

export function recordServicePaymentLocal(input: PaymentRecordInput): PaymentRecordResult {
  initBillingDatabase();

  const totalAmount = roundMoney(Number(input.totalAmount));
  const commissionRate = input.commissionRate ?? PLATFORM_COMMISSION_RATE;
  const commission = calculateCommission(totalAmount, commissionRate);
  const mechanicId = input.mechanicId || 'mech-01';

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) throw new Error('Invalid service bill amount.');

  const existing = db.getFirstSync<any>(
    'SELECT amount, commission, payment_method, wallet_deducted, mechanic_id FROM service_payment_ledger WHERE request_id = ? LIMIT 1',
    [input.requestId],
  );

  if (existing) {
    const wallet = getMechanicWalletSync(existing.mechanic_id);
    return {
      success: true,
      alreadyRecorded: true,
      totalAmount: Number(existing.amount),
      commission: Number(existing.commission),
      mechanicEarning: roundMoney(Number(existing.amount) - Number(existing.commission)),
      walletDeducted: Number(existing.wallet_deducted),
      walletBalanceAfter: wallet.balance,
      paymentMethod: existing.payment_method as PaymentMethod,
      source: 'local',
    };
  }

  const walletBefore = getMechanicWalletSync(mechanicId);
  let walletDeducted = 0;
  let walletBalanceAfter = walletBefore.balance;

  if (input.paymentMethod === 'cash') {
    if (walletBefore.blocked) {
      throw new Error(`Mechanic wallet ৳${walletBefore.balance} এ blocked. Recharge above ৳${MECHANIC_MIN_ACTIVE_WALLET} to accept cash jobs.`);
    }
    if (walletBefore.balance < commission) {
      throw new Error(`Mechanic wallet ৳${walletBefore.balance} is not enough for the ৳${commission} platform fee. Recharge the wallet first.`);
    }
    walletDeducted = commission;
    walletBalanceAfter = roundMoney(walletBefore.balance - walletDeducted);
  }

  const id = `${input.requestId}-${Date.now()}`;
  const now = new Date().toISOString();
  db.execSync('BEGIN TRANSACTION;');
  try {
    if (walletDeducted > 0) {
      db.runSync(
        'UPDATE mechanic_wallets SET balance = ?, updated_at = ? WHERE mechanic_id = ?',
        [walletBalanceAfter, now, mechanicId],
      );
    }
    db.runSync(
      `INSERT INTO service_payment_ledger
        (id, request_id, mechanic_id, amount, commission, payment_method, wallet_deducted, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.requestId, mechanicId, totalAmount, commission, input.paymentMethod, walletDeducted, now],
    );
    db.execSync('COMMIT;');
  } catch (error) {
    db.execSync('ROLLBACK;');
    throw error;
  }

  if (walletDeducted > 0) {
    emitWallet({ mechanicId, balance: walletBalanceAfter, blocked: isMechanicBlocked(walletBalanceAfter), source: 'local' });
  }

  return {
    success: true,
    totalAmount,
    commission,
    mechanicEarning: roundMoney(totalAmount - commission),
    walletDeducted,
    walletBalanceAfter,
    paymentMethod: input.paymentMethod,
    source: 'local',
  };
}

/** Shared payment settlement: server-first, local fallback when the SQL migration is not deployed. */
export async function recordServicePayment(input: PaymentRecordInput): Promise<PaymentRecordResult> {
  const totalAmount = roundMoney(Number(input.totalAmount));
  const commissionRate = input.commissionRate ?? PLATFORM_COMMISSION_RATE;

  try {
    const { data, error } = await supabase.rpc('record_service_payment', {
      p_request_id: input.requestId,
      p_mechanic_id: input.mechanicId,
      p_total_amount: totalAmount,
      p_payment_method: input.paymentMethod,
      p_commission_rate: commissionRate,
    });

    if (!error && data) {
      const row = Array.isArray(data) ? data[0] : data;
      const result: PaymentRecordResult = {
        success: true,
        alreadyRecorded: Boolean(row?.already_recorded),
        totalAmount: Number(row?.total_amount ?? totalAmount),
        commission: Number(row?.commission ?? calculateCommission(totalAmount, commissionRate)),
        mechanicEarning: Number(row?.mechanic_earning ?? (totalAmount - calculateCommission(totalAmount, commissionRate))),
        walletDeducted: Number(row?.wallet_deducted ?? 0),
        walletBalanceAfter: Number(row?.wallet_balance_after ?? DEFAULT_MECHANIC_WALLET),
        paymentMethod: (row?.payment_method || input.paymentMethod) as PaymentMethod,
        source: 'supabase',
      };
      emitWallet({
        mechanicId: input.mechanicId,
        balance: result.walletBalanceAfter,
        blocked: result.walletBalanceAfter <= MECHANIC_MIN_ACTIVE_WALLET,
        source: 'supabase',
      });
      return result;
    }

    if (error && !isMissingRpcError(error)) throw error;
  } catch (error) {
    if (!isMissingRpcError(error)) throw error;
  }

  return recordServicePaymentLocal(input);
}

export function subscribeBilling(listener: (wallet: MechanicWallet) => void) {
  initBillingDatabase();
  return DeviceEventEmitter.addListener(BILLING_WALLET_UPDATED_EVENT, listener);
}
