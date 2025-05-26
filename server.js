import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs/promises";

// Load environment variables
dotenv.config();

const app = express();
const port = 3112;

// Function to replace environment variables in a value
const replaceEnvVars = (value) => {
  if (typeof value !== "string") return value;
  return value.replace(/\${([^}]+)}/g, (match, envVar) => {
    return process.env[envVar] || match;
  });
};

// Function to process config values recursively
const processConfigValues = (obj) => {
  if (typeof obj !== "object" || obj === null) return obj;

  const result = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null) {
      result[key] = processConfigValues(value);
    } else {
      result[key] = replaceEnvVars(value);
    }
  }

  return result;
};

// Load configuration
let config;
try {
  const configFile = await fs.readFile("./config.json", "utf8");
  const rawConfig = JSON.parse(configFile);
  config = processConfigValues(rawConfig);
} catch (error) {
  console.error("Error loading config.json:", error);
  process.exit(1);
}

// Function to make HTTP requests based on action
const makeHttpRequest = async (action) => {
  const actionConfig = config.actions[action];

  if (!actionConfig || !actionConfig.url) {
    console.log(`[SKIPPED] Action: ${action} - Not configured`);
    return;
  }

  try {
    const requestConfig = {
      method: actionConfig.method.toLowerCase(),
      url: actionConfig.url,
      headers: {
        ...actionConfig.headers,
        "X-Event-Timestamp": new Date().toISOString()
      }
    };

    // Add body for POST requests
    if (actionConfig.method === "POST" && actionConfig.body) {
      requestConfig.data = {
        ...actionConfig.body,
        event: action,
        timestamp: new Date().toISOString()
      };
    }

    const response = await axios(requestConfig);
    console.log(
      `[SUCCESS] Action: ${action} - HTTP request successful (${response.status})`
    );
  } catch (error) {
    console.error(
      `[ERROR] Action: ${action} - HTTP request failed:`,
      error.message
    );
  }
};

// Function to log successful requests
const logSuccess = async (action) => {
  console.log(`[SUCCESS] Action: ${action}`);
  await makeHttpRequest(action);
};

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
