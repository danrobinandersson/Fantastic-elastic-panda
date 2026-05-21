import type {
  TivoliApi,
  IdentityTokenResponse,
  CreateTransactionRequest,
  TransactionReceipt,
  PayoutRequest,
  UUID,
} from "./types";

const BASE_URL = import.meta.env.VITE_CENTRALBANK_API_URL;
const API_KEY = import.meta.env.VITE_TIVOLI_API_KEY;

export const tivoliApi: TivoliApi = {
  async getIdentity(token: string): Promise<IdentityTokenResponse> {
    const res = await fetch(`${BASE_URL}/identity-tokens/${token}`);
    if (!res.ok) throw new Error("Failed to fetch identity");
    return res.json();
  },

  async createTransaction(
    request: CreateTransactionRequest,
  ): Promise<TransactionReceipt> {
    const res = await fetch(`${BASE_URL}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...request,
        api_key: API_KEY,
      }),
    });
    if (!res.ok) throw new Error("Failed to create transaction");
    return res.json();
  },

  async payOut(transactionId: UUID, request: PayoutRequest): Promise<void> {
    const res = await fetch(
      `${BASE_URL}/transactions/${transactionId}/payout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...request,
          api_key: API_KEY,
        }),
      },
    );
    if (!res.ok) throw new Error("Failed to payout");
  },
};
