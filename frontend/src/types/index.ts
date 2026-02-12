// Types et interfaces pour SAMA GARAGE

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export enum UserRole {
  ADMIN_GARAGE = 'admin_garage',
  MECHANIC = 'mechanic',
  CASHIER = 'cashier',
  SUPER_ADMIN = 'super_admin',
}

export interface Owner {
  id: string;
  tenant_id: string;
  full_name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  tenant_id: string;
  owner_id: string;
  owner?: Owner;
  registration_number: string;
  brand: string;
  model: string;
  year?: string;
  vin?: string;
  color?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Intervention {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  mechanic_id?: string;
  mechanic?: User;
  type: InterventionType;
  status: InterventionStatus;
  description: string;
  diagnostic_notes?: string;
  work_done?: string;
  estimated_cost?: number;
  final_cost?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export enum InterventionType {
  DIAGNOSTIC = 'diagnostic',
  REPAIR = 'repair',
}

export enum InterventionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export interface StockItem {
  id: string;
  tenant_id: string;
  name: string;
  reference?: string;
  category?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  alert_threshold: number;
  photos?: string[];
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  intervention_id: string;
  intervention?: Intervention;
  invoice_number: string;
  total_amount: number;
  status: InvoiceStatus;
  description?: string;
  issued_date: string;
  paid_date?: string;
  created_at: string;
  updated_at: string;
}

export enum InvoiceStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export interface Payment {
  id: string;
  tenant_id: string;
  invoice_id: string;
  payment_method: PaymentMethod;
  amount_paid: number;
  payment_date: string;
  notes?: string;
  created_at: string;
}

export enum PaymentMethod {
  CASH = 'cash',
  WAVE = 'wave',
  ORANGE_MONEY = 'orange_money',
}

export interface GarageSettings {
  id: string;
  tenant_id: string;
  garage_name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
