import type {
  IdentityTokenResponse,
  TivoliApi,
  TransactionReceipt,
  CreateTransactionRequest,
  PayoutRequest,
  UUID,
} from "./types";

const DIRECT_API_BASE = import.meta.env.VITE_CENTRALBANK_API_URL;
const PROXY_BASE = import.meta.env.VITE_TIVOLI_PROXY_BASE; // e.g. "/tivoli" or "http://localhost:3001/tivoli"

// If a proxy base is provided, use it (frontend will call our server-side proxy).
const API_BASE_URL = PROXY_BASE ?? DIRECT_API_BASE;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw {
      message: `Request failed with status ${response.status}`,
      status: response.status,
    };
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const tivoliApi: TivoliApi = {
  getIdentity(token: string): Promise<IdentityTokenResponse> {
    return request<IdentityTokenResponse>(`/identity-tokens/${token}`);
  },

  createTransaction(
    requestBody: CreateTransactionRequest,
  ): Promise<TransactionReceipt> {
    return request<TransactionReceipt>("/transactions", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
  },

  payOut(transactionId: UUID, requestBody: PayoutRequest): Promise<void> {
    return request<void>(`/transactions/${transactionId}/payout`, {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
  },
};
