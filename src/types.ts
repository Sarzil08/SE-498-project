// types.ts

// ১. UserRole-এ "driver" যোগ করা হয়েছে
export type UserRole = "customer" | "mechanic" | "b2b" | "driver"; 

export interface UserProfile {
  fullName: string;
  mobileNumber: string;
  email: string;
  role: UserRole;
  // Customer dynamic fields
  vehicleType?: "bike" | "car" | "microbus";
  vehicleRegNumber?: string;
  // Mechanic dynamic fields
  specialty?: string;
  nidNumber?: string;
  nidFrontPhotoUrl?: string;
  selfiePhotoUrl?: string;
  isVerified?: boolean;
  // B2B dynamic fields
  companyName?: string;
  fleetSize?: number;
  contactPerson?: string;
}

export interface CodeSnippet {
  filename: string;
  language: string;
  description: string;
  code: string;
}

// ২. ActiveScreen-এ "driver_db" যোগ করা হয়েছে
export type ActiveScreen = "auth" | "customer_db" | "mechanic_db" | "b2b_db" | "subscriptions" | "admin_dashboard" | "driver_db";

export interface BreakdownRequest {
  id: string;
  customerName: string;
  vehicleInfo: string;
  problemType: string;
  problemBangla: string;
  location: string;
  coordinates: { x: number; y: number };
  distance: string;
  timeElapsed: string;
  payout: number;
}

