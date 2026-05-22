import type {
  IdentityTokenResponse,
  Stamp,
  TivoliApi,
  TransactionReceipt,
  PayoutResponse,
} from "./types";

const mockUser = {
  id: 9999,
  name: "Rune Runesson",
};

function randomStamp(): Stamp {
  const animals = ["lion", "dolphin", "toucan", "beetlebug", "snake"] as const;
  const metals = ["silver", "gold", "platinum"] as const;

  const animal = animals[Math.floor(Math.random() * animals.length)];
  const hasMetal = Math.random() < 0.5;

  return {
    animal,
    metal: hasMetal ? metals[Math.floor(Math.random() * metals.length)] : null,
    image_url: null,
  };
}

export const mockTivoliApi: TivoliApi = {
  async getIdentity(_token: string): Promise<IdentityTokenResponse> {
    return {
      user: mockUser,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  },

  async createTransaction(): Promise<TransactionReceipt> {
    return {
      transaction_id: Date.now(),
      amount: 5,
      stamp: Math.random() < 0.7 ? randomStamp() : null,
    };
  },

  async payOut(): Promise<PayoutResponse> {
    return {
      transaction_id: Date.now(),
      amount: 5,
    };
  },
};
