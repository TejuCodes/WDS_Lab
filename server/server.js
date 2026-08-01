import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
dotenv.config();

connectDB();

const app = express();

app.use(cors());

app.use(express.json());

app.use(helmet());

app.use(morgan("dev"));

app.get("/", (req, res) => {

  res.json({

    message: "SecureLearn Backend Running",

  });

});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(`Server running on ${PORT}`);

});