import express from "express";
import {
  addReview,
  getReviewsByProductID,
  deleteReview,
  getAllReviews,
} from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter.post("/add", addReview);
reviewRouter.get("/product/:productID", getReviewsByProductID);
reviewRouter.delete("/delete/:reviewID", deleteReview);
reviewRouter.get("/", getAllReviews);

export default reviewRouter;
