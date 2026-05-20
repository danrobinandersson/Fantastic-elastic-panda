import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const app = express();

app.use(cors());
app.use(express.json());

/*
  SUPABASE DATABASE CONNECTION
*/
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

/*
  ROOT ROUTE
*/
app.get("/", (req, res) => {
  res.send("Scoreboard API is running");
});

/*
  GET TOP SCORES
*/
app.get("/scores", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, centralbank_user_id, player_name, score, created_at
       FROM scores
       ORDER BY score DESC, created_at ASC
       LIMIT 10`,
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database error",
    });
  }
});

/*
  SAVE SCORE
*/
app.post("/scores", async (req, res) => {
  const { centralbankUserId, playerName, score } = req.body;

  /*
    VALIDATION
  */
  if (!centralbankUserId || !playerName || typeof score !== "number") {
    return res.status(400).json({
      message: "centralbankUserId, playerName and score are required",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO scores (
        centralbank_user_id,
        player_name,
        score
      )
       VALUES ($1, $2, $3)
       RETURNING
        id,
        centralbank_user_id,
        player_name,
        score,
        created_at`,
      [centralbankUserId, playerName, score],
    );

    res.status(201).json({
      message: "Score saved",
      score: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database error",
    });
  }
});

/*
  START SERVER
*/
const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
