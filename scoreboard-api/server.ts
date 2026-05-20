import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const CENTRALBANK_BASE_URL = process.env.CENTRALBANK_BASE_URL || "https://api-develop-b059.up.railway.app";
const AMUSEMENT_API_KEY = process.env.AMUSEMENT_API_KEY;

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

app.get("/", (req: express.Request, res: express.Response) => res.send("Scoreboard API is running"));

// Tivoli proxy: create transaction
app.post("/tivoli/create-transaction", async (req: express.Request, res: express.Response) => {
  const body = req.body;
  if (!body || typeof body !== "object") return res.status(400).json({ message: "Request body required" });

  try {
    const resp = await fetch(`${CENTRALBANK_BASE_URL}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, api_key: AMUSEMENT_API_KEY }),
    });

    const text = await resp.text();
    const isJson = resp.headers.get("content-type")?.includes("application/json");
    if (!resp.ok) return res.status(resp.status).contentType(resp.headers.get("content-type") ?? "text/plain").send(text);
    return isJson ? res.json(JSON.parse(text)) : res.send(text);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Proxy error" });
  }
});

// Tivoli proxy: payout by transaction id
app.post("/tivoli/payout", async (req: express.Request, res: express.Response) => {
  const { transactionId, amount, ...rest } = req.body ?? {};
  if (!transactionId || typeof amount !== "number") return res.status(400).json({ message: "transactionId and amount required" });

  try {
    const resp = await fetch(`${CENTRALBANK_BASE_URL}/transactions/${encodeURIComponent(transactionId)}/payout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, api_key: AMUSEMENT_API_KEY, ...rest }),
    });

    const text = await resp.text();
    const isJson = resp.headers.get("content-type")?.includes("application/json");
    if (!resp.ok) return res.status(resp.status).contentType(resp.headers.get("content-type") ?? "text/plain").send(text);
    return isJson ? res.json(JSON.parse(text)) : res.send(text);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Proxy error" });
  }
});

// Mirror endpoints (optional)
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
    if (!resp.ok) return res.status(resp.status).contentType(resp.headers.get("content-type") ?? "text/plain").send(text);
    return isJson ? res.json(JSON.parse(text)) : res.send(text);
  } catch (err) {
    console.error(err);
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
    if (!resp.ok) return res.status(resp.status).contentType(resp.headers.get("content-type") ?? "text/plain").send(text);
    return isJson ? res.json(JSON.parse(text)) : res.send(text);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Proxy error" });
  }
});

app.get('/tivoli/identity-tokens/:token', async (req: express.Request, res: express.Response) => {
  const { token } = req.params as { token?: string };
  try {
    const resp = await fetch(`${CENTRALBANK_BASE_URL}/identity-tokens/${encodeURIComponent(token || "")}`);
    const text = await resp.text();
    const isJson = resp.headers.get("content-type")?.includes("application/json");
    if (!resp.ok) return res.status(resp.status).contentType(resp.headers.get("content-type") ?? "text/plain").send(text);
    return isJson ? res.json(JSON.parse(text)) : res.send(text);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Proxy error" });
  }
});

/*
  GET TOP SCORES
*/
app.get("/scores", async (req: express.Request, res: express.Response) => {
  try {
    const result = await pool.query(
      `SELECT id, player_name, score, created_at
       FROM scores
       ORDER BY score DESC, created_at ASC
       LIMIT 10`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

/*
  SAVE SCORE
*/
app.post("/scores", async (req: express.Request, res: express.Response) => {
  const { playerName, score } = req.body;
  if (!playerName || typeof score !== "number") {
    return res.status(400).json({ message: "playerName and score are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO scores (player_name, score)
       VALUES ($1, $2)
       RETURNING id, player_name, score, created_at`,
      [playerName, score],
    );

    res.status(201).json({ message: "Score saved", score: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
