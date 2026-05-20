import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./db";

// Load .env from scoreboard-api folder during local development
dotenv.config();

const CENTRALBANK_BASE_URL = process.env.CENTRALBANK_BASE_URL || "https://api-develop-b059.up.railway.app";
const AMUSEMENT_API_KEY = process.env.AMUSEMENT_API_KEY;

const app = express();

// Allows your React frontend/Postman to call this API
app.use(cors());

// Allows Express to read JSON from req.body
app.use(express.json());

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("Scoreboard API is running");
});

// Tivoli proxy endpoints - forward requests server-side so the amusement API key
// is never exposed to the browser. The frontend should call these endpoints.
app.post("/tivoli/create-transaction", async (req: express.Request, res: express.Response) => {
  const body = req.body;

  if (!body || typeof body !== "object") {
    return res.status(400).json({ message: "Request body required" });
  }

  try {
    // Forward the request to the Centralbank /transactions endpoint
    const resp = await fetch(`${CENTRALBANK_BASE_URL}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, api_key: AMUSEMENT_API_KEY }),
    });

    const text = await resp.text();
    const isJson = resp.headers.get("content-type")?.includes("application/json");

    if (!resp.ok) {
      return res.status(resp.status).contentType(resp.headers.get("content-type") ?? "text/plain").send(text);
    }

    return isJson ? res.json(JSON.parse(text)) : res.send(text);
  } catch (error) {
    console.error("Tivoli proxy create-transaction error:", error);
    return res.status(500).json({ message: "Proxy error" });
  }
});

app.post("/tivoli/payout", async (req: express.Request, res: express.Response) => {
  const { transactionId, amount, ...rest } = req.body ?? {};

  if (!transactionId || typeof amount !== "number") {
    return res.status(400).json({ message: "transactionId and amount required" });
  }

  try {
    const resp = await fetch(`${CENTRALBANK_BASE_URL}/transactions/${encodeURIComponent(transactionId)}/payout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, api_key: AMUSEMENT_API_KEY, ...rest }),
    });

    const text = await resp.text();
    const isJson = resp.headers.get("content-type")?.includes("application/json");

    if (!resp.ok) {
      return res.status(resp.status).contentType(resp.headers.get("content-type") ?? "text/plain").send(text);
    }

    return isJson ? res.json(JSON.parse(text)) : res.send(text);
  } catch (error) {
    console.error("Tivoli proxy payout error:", error);
    return res.status(500).json({ message: "Proxy error" });
  }
});

// Mirror the Centralbank API shape so the frontend can call the same paths
// when VITE_TIVOLI_PROXY_BASE is set to e.g. http://localhost:3001/tivoli
app.post("/tivoli/transactions", async (req: express.Request, res: express.Response) => {
  const body = req.body;
  try {
    const resp = await fetch(`${CENTRALBANK_BASE_URL}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, api_key: AMUSEMENT_API_KEY }),
    });

    const text = await resp.text();
    const isJson = resp.headers.get("content-type")?.includes("application/json");

    if (!resp.ok) {
      return res.status(resp.status).contentType(resp.headers.get("content-type") ?? "text/plain").send(text);
    }

    return isJson ? res.json(JSON.parse(text)) : res.send(text);
  } catch (error) {
    console.error("Tivoli proxy /transactions error:", error);
    return res.status(500).json({ message: "Proxy error" });
  }
});

app.post("/tivoli/transactions/:id/payout", async (req: express.Request, res: express.Response) => {
  const { id } = req.params as { id?: string };
  try {
    const resp = await fetch(`${CENTRALBANK_BASE_URL}/transactions/${encodeURIComponent(id || "")}/payout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...req.body, api_key: AMUSEMENT_API_KEY }),
    });

    const text = await resp.text();
    const isJson = resp.headers.get("content-type")?.includes("application/json");

    if (!resp.ok) {
      return res.status(resp.status).contentType(resp.headers.get("content-type") ?? "text/plain").send(text);
    }

    return isJson ? res.json(JSON.parse(text)) : res.send(text);
  } catch (error) {
    console.error("Tivoli proxy /transactions/:id/payout error:", error);
    return res.status(500).json({ message: "Proxy error" });
  }
});

app.get('/tivoli/identity-tokens/:token', async (req: express.Request, res: express.Response) => {
  const { token } = req.params as { token?: string };
  try {
    const resp = await fetch(`${CENTRALBANK_BASE_URL}/identity-tokens/${encodeURIComponent(token || "")}`);
    const text = await resp.text();
    const isJson = resp.headers.get("content-type")?.includes("application/json");

    if (!resp.ok) {
      return res.status(resp.status).contentType(resp.headers.get("content-type") ?? "text/plain").send(text);
    }

    return isJson ? res.json(JSON.parse(text)) : res.send(text);
  } catch (error) {
    console.error('Tivoli proxy identity-tokens error:', error);
    return res.status(500).json({ message: 'Proxy error' });
  }
});

app.get("/scores", async (req: express.Request, res: express.Response) => {
  try {
    const [rows] = await db.query(
      `SELECT player_name, score, token, created_at
       FROM scores
       ORDER BY score DESC, created_at ASC
       LIMIT 10`,
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

app.post("/scores", async (req: express.Request, res: express.Response) => {
  const { playerName, score, token } = req.body;

  if (!playerName || typeof score !== "number") {
    return res.status(400).json({
      message: "playerName and score are required",
    });
  }

  try {
    await db.query(
      `INSERT INTO scores (player_name, score, token)
       VALUES (?, ?, ?)`,
      [playerName, score, token ?? null],
    );

    res.status(201).json({ message: "Score saved" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
