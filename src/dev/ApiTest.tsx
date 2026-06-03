import { useEffect, useState } from "react";
import { api } from "../api";
import { getIdentityTokenFromUrl } from "../utils/identityToken";
import type { IdentityUser } from "../api/types";

export function ApiTest() {
  const [player, setPlayer] = useState<IdentityUser | null>(null);
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

      try {
        console.log('[ApiTest] Calling getIdentity...');
        const identity = await api.getIdentity(t);
        console.log('[ApiTest] Got identity:', identity);
        setPlayer(identity.user);
      } catch (err) {
        console.error('[ApiTest] Error getting identity:', err);
        setError("Token expired.");
      }
    }

    void load();
  }, []);

  if (error) return <p>{error}</p>;
  if (!player) return <p>Loading...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>API Test (New)</h1>

      <p>Welcome {player.name}</p>

      <p>Transactions are disabled in this build.</p>
    </div>
  );
}
