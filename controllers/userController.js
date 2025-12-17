import e from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";
import nodemailer from "nodemailer";
import Otp from "../models/Otp.js";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "nuwanshanuka1227@gmail.com",
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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

      if (user.isBlocked) {
        res
          .status(403)
          .json({ message: "User is blocked. Contact admin for assistance." });
        return;
      }

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
          user: user,
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
        user: newUser,
      });
    } else {
      if (user.isBlocked) {
        res
          .status(403)
          .json({ message: "User is blocked. Contact admin for assistance." });
        return;
      }

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
        user: user,
      });
    }
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function validateOTPAndUpdatePassword(req, res) {
  try {
    const otp = req.body.otp;
    const newPassword = req.body.newPassword;
    const email = req.body.email;

    const otpRecord = await Otp.findOne({ email: email, otp: otp });

    if (otpRecord == null) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await User.updateOne(
      { email: email },
      { $set: { password: hashedPassword, isEmailVerified: true } }
    );
    await Otp.deleteMany({ email: email });

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in validateOTPAndUpdatePassword:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function sendOTP(req, res) {
  try {
    const email = req.params.email;

    const user = await User.findOne({ email: email });

    if (user == null) {
      return res.status(404).json({ message: "User not found" });
    }

    await Otp.deleteMany({
      email: email,
    });
    //generate random 6 digit otp
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = new Otp({
      email: email,
      otp: otpCode,
    });
    await otp.save();

    const message = {
      from: "nuwanshanuka1227@gmail.com",
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is ${otpCode}`,
    };

    transporter.sendMail(message, (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
        return res.status(500).json({ message: "Failed to send OTP email" });
      } else {
        console.log("Email sent:", info.response);
        return res.json({ message: "OTP email sent successfully" });
      }
    });
  } catch (error) {
    console.error("Error in sendOTP:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAllUsers(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({
      message: "Admin access required",
    });
    return;
  }

  try {
    const users = await User.find();
    res.json({ users });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching users",
      error: error.message,
    });
  }
}

export async function updateUserStatus(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({
      message: "Admin access required",
    });
    return;
  }

  const email = req.params.email;

  if (req.user.email === email) {
    return res.status(400).json({
      message: "Admin cannot block/unblock themselves",
    });
  }

  const isBlocked = req.body.isBlocked;

  try {
    await User.updateOne(
      {
        email: email,
      },
      {
        $set: { isBlocked: isBlocked },
      }
    );

    res.json({ message: "User status updated successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error updating user status",
      error: error.message,
    });
  }
}

export async function contactUs(req, res) {
  const { name, email, subject, message } = req.body;

  try {
    const mailOptions = {
      from: "nuwanshanuka1227@gmail.com", // යවන්නේ ඔයාගේ සිස්ටම් ඊමේල් එකෙන්
      to: "shanukaalahakoon456@gmail.com", // කාටද ලැබෙන්න ඕනේ? (Admin ට)
      replyTo: email, // User ගේ email එක reply-to විදියට දානවා
      subject: `New Contact Msg: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
          <h2 style="color: #333;">New Message from i-Computers Website</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <br/>
          <p><strong>Message:</strong></p>
          <p style="background: #f9f9f9; padding: 15px; border-radius: 5px;">${message}</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Contact Email Error:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
}
