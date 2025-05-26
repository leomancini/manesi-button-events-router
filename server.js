import express from "express";

const app = express();
const port = 3112;

// Add request logging middleware
app.use((req, res, next) => {
  const action = req.query.action;
  if (action) {
    console.log(`Action: ${action}`);
  }
  next();
});

app.get("/", (req, res) => {
  res.send("Hello world!");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
