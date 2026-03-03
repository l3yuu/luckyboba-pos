// src/types/cash-count.ts

export interface KeyboardRef {
  setInput: (input: string) => void;
}

export interface Transaction {
  id: number;
  time: string;
  date: string;
  total: number;
  remarks: string;
  breakdown: { [key: number]: string };
}

export interface ActiveInput {
  type: 'count' | 'remarks';
  id?: number;
}