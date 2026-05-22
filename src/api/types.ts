export type UUID = string;

export type Animal = "lion" | "dolphin" | "toucan" | "beetlebug" | "snake";
export type Metal = "silver" | "gold" | "platinum";

export interface Stamp {
  animal: Animal;
  metal: Metal | null;
  image_url: string | null;
}

export interface IdentityUser {
  id: number;
  name: string;
}

export interface IdentityTokenResponse {
  user: IdentityUser;
  expires_at: string;
}

export interface CreateTransactionRequest {
  identity_token: string;
  amount: number;
}

export interface TransactionReceipt {
  transaction_id: number;
  amount: number;
  stamp: Stamp | null;
}

export interface PayoutRequest {
  amount: number;
}

export interface PayoutResponse {
  transaction_id: number;
  amount: number;
}

export interface TivoliApi {
  getIdentity(token: string): Promise<IdentityTokenResponse>;

  createTransaction(
    request: CreateTransactionRequest,
  ): Promise<TransactionReceipt>;

  payOut(
    transactionId: number,
    request: PayoutRequest,
  ): Promise<PayoutResponse>;
}
