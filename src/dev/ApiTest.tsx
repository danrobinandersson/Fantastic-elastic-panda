import { useEffect, useState } from "react";
import { api } from "../api";
import { getIdentityTokenFromUrl } from "../utils/identityToken";
import type { IdentityUser } from "../api/types";

export function ApiTest() {
  const [player, setPlayer] = useState<IdentityUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [stamp, setStamp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load(): Promise<void> {
      const t = getIdentityTokenFromUrl();
      console.log('[ApiTest] Token from URL:', t);

      if (!t) {
        console.log('[ApiTest] No token found');
        setError("No token found. Open via Tivoli.");
        return;
      }

      setToken(t);

      try {
        console.log('[ApiTest] Calling getIdentity...');
        const identity = await api.getIdentity(t);
        console.log('[ApiTest] Got identity:', identity);
        setPlayer(identity.user);
      } catch (err) {
        console.error('[ApiTest] Error getting identity:', err);
        setError("Token expired. Go back to Tivoli.");
      }
    }

    void load();
  }, []);

  async function handlePay(): Promise<void> {
    if (!token) return;

    try {
      console.log('[ApiTest] Creating transaction...');
      const receipt = await api.createTransaction({
        identity_token: token,
        amount: 5,
      });

      console.log('[ApiTest] Transaction created:', receipt);
if (receipt.stamp) {
  const stampText = receipt.stamp.metal
    ? `${receipt.stamp.metal} ${receipt.stamp.animal}`
    : receipt.stamp.animal;

  setStamp(stampText);
} else {
  setStamp("No stamp");
}    } catch (err) {
      console.error('[ApiTest] Transaction failed:', err);
      setError("Transaction failed. Try again from Tivoli.");
    }
  }

  if (error) return <p>{error}</p>;
  if (!player) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>API Test (New)</h1>

      <p>Welcome {player.name}</p>

      <button onClick={handlePay}>Pay €5</button>

      {stamp && <p>Stamp received: {stamp}</p>}
    </div>
  );
}
