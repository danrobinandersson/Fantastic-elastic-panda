import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const db = mysql.createPool({
  user: "root",
  password: process.env.DB_PASSWORD,
  database: "panda_scoreboard",
  socketPath: "/tmp/mysql.sock",
});
