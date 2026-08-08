const express = require("express");
const {Pool} = require("pg");
require("dotenv").config();
const cors = require("cors");

const server = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Middleware   
server.use(cors());
server.use(express.json());

// Routes
server.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// Test route to check database connection
server.get("/db-health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "Database connection successful", time: result.rows[0] });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});