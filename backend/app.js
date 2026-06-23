const express = require("express");
const cors = require("cors");
const authRoute = require("./routes/authRoute");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Maze NFC API",
  });
});

app.use("/api/auth", authRoute);

module.exports = app;
