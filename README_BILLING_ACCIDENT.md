# Car Rescue BD — Billing + Accident SMS update

This bundle keeps the existing Customer / Driver / Mechanic / B2B UI structure and adds two modules:

## 1) Pathao/Uber-style service billing

The Service payment screen now shows:

- Service/visit fee
- Extra parts/work
- Customer total
- Car Rescue platform fee = 10%
- Mechanic earning = 90%
- bKash / Nagad / Card / Cash options

### Cash rule

For cash service, the customer pays the mechanic the full bill. The 10% Car Rescue fee is automatically deducted from the mechanic's pre-funded wallet.

Example:

`৳1000 bill → ৳100 platform fee → mechanic receives ৳900 → wallet decreases by ৳100 for a cash job.`

A mechanic whose wallet is **৳100 or below is blocked** from accepting new jobs / going online. They must recharge above ৳100.

`src/services/billingStore.ts` uses a local SQLite fallback for demo mode. For a shared multi-device wallet, deploy:

`supabase/migrations/20261003_billing_system.sql`

The migration adds shared wallet + payment ledger tables and atomic server-side cash commission settlement.

### Real payment gateways

The bKash, Nagad and Card buttons are wired into the billing/ledger flow, but actual money movement still needs your merchant gateway credentials and gateway callback/server integration. The bundle does not invent gateway credentials.

## 2) Automatic accident SMS

Accident flow:

`Accident signal → 20-second no-movement check → SMS only when no movement is detected.`

Movement is cancelled when:

- hardware sends `moving: true`, or `speedKmh > 1`, or
- GPS movement reaches the 15-meter threshold.

Recipients are controlled only from **Customer Settings** and **Driver Settings**:

- Accident Alert ON/OFF
- Your contact number
- Emergency contact number
- Vehicle owner/B2B owner number
- Send SMS to Emergency Contact ON/OFF
- Send SMS to Nearby Mechanics ON/OFF
- Send SMS to Vehicle Owner ON/OFF

The accident message includes the customer/driver contact number, vehicle info and the current Google Maps coordinate link.

### Automatic SMS vs phone SMS composer

For truly automatic/background SMS, deploy the Supabase Edge Function:

`supabase/functions/send-accident-sms/index.ts`

Set these Supabase secrets:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

The app first calls that server function. If it is unavailable, it falls back to the device's `expo-sms` composer. That fallback **does not silently send SMS**; the user may need to confirm/send it from the phone UI.

### Accident signal source

A reusable bridge is provided:

`src/services/AccidentSignalBridge.ts`

Any ESP32/native/hardware integration can call `emitAccidentSignal({...})` with role, driver/customer info, vehicle info and optional live sensor values. The Customer and Driver dashboards listen for those events automatically.

The supplied app did not contain a confirmed existing ESP32 accident-event API, so this bridge is the integration point rather than an invented hardware protocol.

### Safe test

Customer and Driver Settings include **Test 20 sec**. It runs the same 20-second movement check but never sends SMS.

## Existing project files

The bundle includes the latest UI/service files plus the billing and accident additions. Keep your existing Expo package versions and assets.

Required packages already used by the project include:

- `expo-sqlite`
- `expo-location`
- `expo-sms`
- `@supabase/supabase-js`
- `react-native-maps`
- `lucide-react-native`

Do not commit Twilio credentials to the app. Store them only as Supabase Edge Function secrets.


## UI updates in this build
- Home PRO now opens the dedicated `src/screens/SubscriptionScreen.tsx` screen instead of the old subscription modal component.
- Customer Home SOS opens `OfflineAssistanceScreen` directly. The offline screen initializes SQLite/local mechanic cache first, can send device SMS with GPS without internet, and can refresh the cache only when online.
- Service accepted-state layout is now `Mechanic is coming your way` -> one map -> mechanic details -> bill/payment. No second map appears below mechanic details.
- `EmergencyMechanicRequest` accepts `showAcceptedDetails={false}` so Service can control the accepted-state layout.
