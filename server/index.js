import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import routes from "./routes/index.js";   // ADD THIS

dotenv.config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// mount routes
app.use("/api", routes);   // ADD THIS

// test route
app.get("/", (req, res) => {
  res.send("Nebulon API running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});