import Review from "../models/review.js";
import { isAdmin } from "./userController.js";
import Product from "../models/Product.js";

export async function addReview(req, res) {
  // Debugging: Controller එකට එනකොට user ඉන්නවද බලන්න
  console.log("User inside addReview Controller:", req.user);

  if (req.user == null) {
    return res.status(401).json({ message: "Please login to write a review" });
  }

  try {
    const product = await Product.findOne({ productID: req.body.productID });

    if (product == null) {
      return res.status(404).json({ message: "Product not found" });
    }

    // --- ID Generation Logic ---
    const latestReview = await Review.findOne().sort({ date: -1 });
    let reviewID = "REV0001";

    if (latestReview) {
      const latestReviewId = latestReview.reviewID;
      const latestIdString = latestReviewId.replace("REV", "");
      const latestIdNum = parseInt(latestIdString);
      const newIdNum = latestIdNum + 1;
      reviewID = "REV" + newIdNum.toString().padStart(4, "0");
    }
    // ----------------------------

    // User ගේ නම හදාගැනීම
    const name = req.user.firstName + " " + req.user.lastName;

    // User ගේ profile image එක ගැනීම (ඔයාගේ Log එකේ තිබුනේ 'image' කියලා)
    const userImage =
      req.user.image || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    const newReview = new Review({
      reviewID: reviewID,
      productID: req.body.productID,
      email: req.user.email, // මෙතන req.user.email අනිවාර්යයෙන්ම වැඩ කරන්න ඕන
      name: name,
      rating: req.body.rating,
      comment: req.body.comment,
      profileImage: userImage, // 'image' එක 'profileImage' field එකට දානවා
    });

    await newReview.save();

    res.json({ message: "Review added successfully", reviewID: reviewID });
  } catch (error) {
    console.error("Error adding review:", error); // Error එක Terminal එකේ Print වෙනවා
    res.status(500).json({
      message: "Error adding review",
      error: error.message,
    });
  }
}

export async function getReviewsByProductID(req, res) {
  const productID = req.params.productID;
  try {
    const reviews = await Review.find({ productID: productID });
    res.json({ reviews });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching reviews", error: error.message });
  }
}

export async function deleteReview(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({
      message: "Admin access required",
    });
    return;
  }
  const reviewID = req.params.reviewID;

  try {
    const result = await Review.deleteOne({ reviewID: reviewID });

    if (result.deletedCount == 0) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting review", error: error.message });
  }
}

export function getAllReviews(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({
      message: "Admin access required",
    });
    return;
  }
  Review.find()
    .sort({ date: -1 })
    .then((reviews) => {
      res.json({ reviews });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Error fetching reviews",
        error: error.message,
      });
    });
}
