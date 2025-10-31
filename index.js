import express from "express";
import mongoose, { mongo, Mongoose } from "mongoose";
import userRouter from "./routes/userRouter.js";
import productRouter from "./routes/productRouter.js";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGO_URL;

mongoose.connect(mongoURI).then(() => {
  console.log("MongoDB connected");
});

const app = express();

app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
  const authorizationHeader = req.header("Authorization");

  if (authorizationHeader != null) {
    const token = authorizationHeader.replace("Bearer ", "");

    jwt.verify(token, process.env.JWT_SECRET, (error, content) => {
      if (content == null) {
        console.log("Invalid Token");

        res.json({ message: "Invalid Token" });
      } else {
        req.user = content;
        next();
      }
    });
  } else {
    next();
  }
});

app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.listen(4000, () => {
  console.log("Server is running on port 4000");
});
