const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const eventRoutes = require("./routes/eventRoutes");

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/events", eventRoutes);

// Basic health route (optional)
app.get("/", (req, res) => {
  res.json({ message: "Advanced Event Management API" });
});

// Error handler middleware (for thrown errors)
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
