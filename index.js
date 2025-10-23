import express from "express";
import mongoose, { mongo, Mongoose } from "mongoose";
import userRouter from "./routes/userRouter.js";
import productRouter from "./routes/productRouter.js";
import jwt from "jsonwebtoken";

const mongoURI =
  "mongodb+srv://admin:1234@cluster0.6qu6tez.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI).then(() => {
  console.log("MongoDB connected");
});

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  const authorizationHeader = req.header("Authorization");

  if (authorizationHeader != null) {
    const token = authorizationHeader.replace("Bearer ", "");

    jwt.verify(token, "secretKey#1227", (error, content) => {
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

app.use("/users", userRouter);
app.use("/products", productRouter);
app.listen(4000, () => {
  console.log("Server is running on port 4000");
});
