import express from "express";
import cors from "cors";
import { db } from "./db";

const app = express();

// Allows your React frontend/Postman to call this API
app.use(cors());

// Allows Express to read JSON from req.body
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Scoreboard API is running");
});

app.get("/scores", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT player_name, score, created_at
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

app.post("/scores", async (req, res) => {
  const { playerName, score } = req.body;

  if (!playerName || typeof score !== "number") {
    return res.status(400).json({
      message: "playerName and score are required",
    });
  }

  try {
    await db.query(
      `INSERT INTO scores (player_name, score)
       VALUES (?, ?)`,
      [playerName, score],
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
