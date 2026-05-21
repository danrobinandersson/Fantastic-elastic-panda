export type UUID = string;

export type Animal = "lion" | "dolphin" | "tucan" | "beetlebug" | "snake";
export type Metal = "silver" | "gold" | "platinum";
export type Stamp = Animal | `${Metal} ${Animal}`;

export interface IdentityUser {
  id: UUID;
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
  id: UUID;
  stamp: Stamp;
}

export interface PayoutRequest {
  amount: number;
}

export interface TivoliApi {
  getIdentity(token: string): Promise<IdentityTokenResponse>;

  createTransaction(
    request: CreateTransactionRequest,
  ): Promise<TransactionReceipt>;

  payOut(transactionId: UUID, request: PayoutRequest): Promise<void>;
}
