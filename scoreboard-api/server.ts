import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://kfjvevfrzqnxlerwrtaa.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

if (!SUPABASE_ANON_KEY) {
  console.warn(
    "Warning: VITE_SUPABASE_ANON_KEY not set. Scores endpoints may fail.",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

app.get("/", (_req: express.Request, res: express.Response) =>
  res.send("Scoreboard API is running"),
);

/*
  GET TOP SCORES
*/
app.get("/scores", async (_req: express.Request, res: express.Response) => {
  try {
    const { data, error } = await supabase
      .from("scores")
      .select("id, player_name, score, created_at")
      .order("score", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ message: "Database error" });
    }

    res.json(data || []);
  } catch (err) {
    console.error("Error fetching scores:", err);
    res.status(500).json({ message: "Database error" });
  }
});

/*
  POST SCORE — no login required, name supplied at submit time.
  Body: { playerName: string, score: number }
  Each submission is a new row; we keep the player's personal best
  by only updating if the new score beats their current best (matched by name).
*/
app.post("/scores", async (req: express.Request, res: express.Response) => {
  const { playerName, score } = req.body;

  if (!playerName || typeof score !== "number") {
    return res.status(400).json({
      message: "playerName and score are required",
    });
  }

  const trimmedName = String(playerName).trim().slice(0, 32);

  if (!trimmedName) {
    return res.status(400).json({ message: "playerName cannot be empty" });
  }

  try {
    // Check if this name already has a score row
    const { data: existing, error: fetchError } = await supabase
      .from("scores")
      .select("id, score")
      .ilike("player_name", trimmedName)
      .limit(1);

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return res.status(500).json({ message: "Database error" });
    }

    const existingRow = existing && existing.length > 0 ? existing[0] : null;

    if (!existingRow) {
      // First time this name appears — insert a new row
      const { data: insertData, error: insertError } = await supabase
        .from("scores")
        .insert([
          {
            id: randomUUID(),
            player_name: trimmedName,
            score,
          },
        ])
        .select("id, player_name, score, created_at");

      if (insertError) {
        console.error("Insert error:", JSON.stringify(insertError, null, 2));
        return res
          .status(500)
          .json({ message: "Database error", details: insertError.message });
      }

      return res.status(201).json({
        message: "Score saved",
        score: insertData?.[0],
      });
    }

    // Name exists — only update if new score is higher
    if (score > existingRow.score) {
      const { data: updateData, error: updateError } = await supabase
        .from("scores")
        .update({ score, created_at: new Date().toISOString() })
        .eq("id", existingRow.id)
        .select("id, player_name, score, created_at");

      if (updateError) {
        console.error("Update error:", updateError);
        return res.status(500).json({ message: "Database error" });
      }

      return res.json({
        message: "High score updated",
        score: updateData?.[0],
      });
    }

    return res.json({
      message: "Score not higher than existing best",
      score: existingRow,
    });
  } catch (err) {
    console.error("Error saving score:", err);
    res.status(500).json({ message: "Database error" });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`),
);