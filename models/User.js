import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "customer",
  },

  isBlocked: {
    type: Boolean,
    default: false,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  image: {
    type: String,
    default: "/defaultProfile.png",
    required: true,
  },
});

const User = mongoose.model("User", userSchema);
export default User;
