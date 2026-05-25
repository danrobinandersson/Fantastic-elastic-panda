import type {
  TivoliApi,
  IdentityTokenResponse,
  CreateTransactionRequest,
  TransactionReceipt,
  PayoutRequest,
  PayoutResponse,
} from "./types";

const CENTRALBANK_URL = import.meta.env.VITE_CENTRALBANK_API_URL;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API_KEY = import.meta.env.VITE_TIVOLI_API_KEY;

export const tivoliApi: TivoliApi = {
async getIdentity(token: string): Promise<IdentityTokenResponse> {
  const res = await fetch(
    `${BACKEND_URL}/tivoli/identity-tokens/${token}`
  );

  if (!res.ok) {
    const errorText = await res.text();

    console.error("Identity error:", {
      status: res.status,
      body: errorText,
    });

    throw new Error(`Failed to fetch identity: ${res.status}`);
  }

  return res.json();
},
  async createTransaction(
    request: CreateTransactionRequest,
  ): Promise<TransactionReceipt> {
    const res = await fetch(`${CENTRALBANK_URL}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...request,
        api_key: API_KEY,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Transaction/create error:", {
        status: res.status,
        body: errorText,
      });
      throw new Error(`Failed to create transaction: ${res.status}`);
    }

    return res.json();
  },

  async payOut(
    transactionId: number,
    request: PayoutRequest,
  ): Promise<PayoutResponse> {
    const res = await fetch(
      `${CENTRALBANK_URL}/transactions/${transactionId}/payout`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...request,
          api_key: API_KEY,
        }),
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Payout error:", {
        status: res.status,
        body: errorText,
      });
      throw new Error(`Failed to payout: ${res.status}`);
    }

    return res.json();
  },
};
