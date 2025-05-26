import express from "express";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const port = 3112;

// Function to log successful requests
const logSuccess = (action) => {
  console.log(`[SUCCESS] Action: ${action}`);
};

// Add request logging middleware (moved before API key validation)
app.use((req, res, next) => {
  const action = req.query.action;
  if (action) {
    console.log(`Action: ${action}`);
  }
  next();
});

// API key validation middleware
app.use((req, res, next) => {
  const apiKey = req.query.apiKey;
  const validApiKey = process.env.API_KEY;

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({ error: "Invalid API key" });
  }
  next();
});

app.get("/", (req, res) => {
  const action = req.query.action;
  if (action) {
    logSuccess(action);
  }
  res.send("Hello world!");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
