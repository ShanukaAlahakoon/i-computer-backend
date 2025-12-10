import express from "express";
import {
  getAllProducts,
  createProduct,
  deleteProduct,
  updateProduct,
  getProductByID,
  searchProducts,
} from "../controllers/productController.js";

const productRouter = express.Router();

productRouter.get("/", getAllProducts);

productRouter.get("/search/:query", searchProducts);

productRouter.post("/", createProduct);

productRouter.delete("/:productID", deleteProduct);

productRouter.put("/:productID", updateProduct);

productRouter.get("/:productID", getProductByID);

export default productRouter;
