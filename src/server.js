const express = require("express");
const {createClient} = require("@supabase/supabase-js");
require("dotenv").config();
const cors = require("cors");

const server = express();
const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_ANON_KEY
);

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
    const { data, error } = await supabase
    .from("users")
    .select("*")
    .limit(1); // Just to check if we can fetch data

    if (error) throw error;

    res.json({ status: "Database connection is healthy"});
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ error: error.message });
  }
});

const authRoutes = require("./routes/auth");
server.use("/auth", authRoutes);
const goalsRoutes = require("./routes/goals");
server.use("/goals", goalsRoutes);
const reportsRoutes = require("./routes/reports");
server.use("/reports", reportsRoutes);
const walletRoutes = require("./routes/wallet");
server.use("/wallet", walletRoutes);
const chargeRoutes = require("./routes/charges");
server.use("/charges", chargeRoutes);
const { startChargeJob } = require("./jobs/chargeJob");
startChargeJob();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});