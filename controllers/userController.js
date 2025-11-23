import e from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

export function createUser(req, res) {
  const data = req.body;

  const hashedPassword = bcrypt.hashSync(data.password, 10);

  const user = new User({
    email: data.email,
    password: hashedPassword,
    firstName: data.firstName,
    lastName: data.lastName,
  });

  user.save().then(() => {
    res.json({ message: "User created successfully" });
  });
}

export function loginUser(req, res) {
  const email = req.body.email;
  const password = req.body.password;

  User.find({ email: email }).then((users) => {
    if (users[0] == null) {
      res.status(404).json({ message: "User not found" });
    } else {
      const user = users[0];

      const isPasswordValid = bcrypt.compareSync(password, user.password);

      if (isPasswordValid) {
        const payload = {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          image: user.image,
          isEmailVerified: user.isEmailVerified,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: "150h",
        });

        res.json({
          message: "Login successful",
          token: token,
          role: user.role,
        });
      } else {
        res.status(401).json({ message: "Invalid password" });
      }
    }
  });
}

export function isAdmin(req) {
  if (req.user == null) {
    return false;
  }

  if (req.user.role !== "admin") {
    return false;
  }

  return true;
}

export function getUser(req, res) {
  if (req.user == null) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.json(req.user);
}

export async function googleLogin(req, res) {
  console.log(req.body.token);
  try {
    const response = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${req.body.token}`,
        },
      }
    );
    console.log(response.data);
    const user = await User.findOne({ email: response.data.email });
    if (user == null) {
      const newUser = new User({
        email: response.data.email,
        firstName: response.data.given_name,
        lastName: response.data.family_name,
        image: response.data.picture,
        password: "123",
      });
      await newUser.save();
      const payload = {
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        image: newUser.image,
        isEmailVerified: newUser.isEmailVerified,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "150h",
      });
      res.json({
        message: "Login successful",
        token: token,
        role: newUser.role,
      });
    } else {
      const payload = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        image: user.image,
        isEmailVerified: user.isEmailVerified,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "150h",
      });

      res.json({
        message: "Login successful",
        token: token,
        role: user.role,
      });
    }
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
