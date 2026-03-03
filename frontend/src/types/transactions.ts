/**
 * DATABASE / API TYPES
 */
export interface BackendTransaction {
  id: number;
  amount: string; 
  note: string | null;
  created_at: string;
  type: 'cash_in' | 'cash_drop' | 'cash_out';
}

/**
 * DOMAIN / UI DATA TYPES
 */
export interface Transaction {
  id: number;
  time: string;
  date: string;
  total: number;
  remarks: string;
  breakdown: Record<number, string>;
}

export interface Receipt {
    id: number;
    sale_id: number;
    si_number: string;
    terminal: string;
    items_count: number;
    cashier_name: string;
    total_amount: number | string;
    status: 'completed' | 'cancelled'; // <--- ADD THIS LINE
    created_at: string;
    cancellation_reason?: string; 
    cancelled_at?: string;
}

/**
 * SHARED UI & COMPONENT TYPES
 */
export interface KeyboardRef {
  setInput: (input: string) => void;
}

export interface CashComponentProps {
  onSuccess?: () => void;
}

export type CashInProps = CashComponentProps;
export type CashDropProps = CashComponentProps;
export type InputType = 'count' | 'remarks' | 'amount';

export interface ActiveInput {
  type: InputType;
  id?: number; 
}

export interface ReceiptData {
  date: string;
  time: string;
}