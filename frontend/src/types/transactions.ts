/**
 * DATABASE / API TYPES
 * These reflect your Backend models.
 */
export interface BackendTransaction {
  id: number;
  amount: string; // Backend sends decimal as string for precision
  note: string | null;
  created_at: string;
  type: 'cash_in' | 'cash_drop' | 'cash_out'; // Use Literal Types for safety
}

/**
 * DOMAIN / UI DATA TYPES
 * Transformed data used for display in the frontend.
 */
export interface Transaction {
  id: number;
  time: string;
  date: string;
  total: number;
  remarks: string;
  breakdown: Record<number, string>;
}

/**
 * COMPONENT PROP TYPES
 * Standardized props for your transaction-related components.
 */
export interface CashComponentProps {
  onSuccess?: () => void;
}

// You can alias them if you prefer specific names
export type CashInProps = CashComponentProps;
export type CashDropProps = CashComponentProps;

/**
 * SHARED UI TYPES
 * Types for the virtual keyboard and input tracking.
 */
export interface KeyboardRef {
  setInput: (input: string) => void;
}

export type InputType = 'count' | 'remarks' | 'amount';

export interface ActiveInput {
  type: InputType;
  id?: number; // Used for denomination ID in cash counting
}

export interface ReceiptData {
  date: string;
  time: string;
}