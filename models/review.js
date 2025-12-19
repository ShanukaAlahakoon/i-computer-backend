import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  reviewID: {
    type: String,
    required: true,
    unique: true,
  },
  productID: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: false,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  profileImage: {
    type: String,
    default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    required: false,
  },
});

const Review = mongoose.model("Review", reviewSchema);
export default Review;
