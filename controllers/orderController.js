import e from "express";
import Order from "../models/order.js";
import Product from "../models/Product.js";
import { isAdmin } from "./userController.js";

// Create a new order
export async function createOrder(req, res) {
  console.log("Create Order Request Body:", req.body);
  if (req.user == null) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const latestOrder = await Order.findOne().sort({ date: -1 });

    let orderId = "ORD0001";
    if (latestOrder != null) {
      let latestOrderId = latestOrder.orderId;
      let latestOrderNumberString = latestOrderId.replace("ORD", "");
      let latestOrderNumber = parseInt(latestOrderNumberString);
      let newOrderNumber = latestOrderNumber + 1;
      orderId = "ORD" + newOrderNumber.toString().padStart(4, "0");
    }

    const items = [];
    let total = 0;

    for (let i = 0; i < req.body.items.length; i++) {
      const product = await Product.findOne({
        productID: req.body.items[i].productID,
      });

      if (product == null) {
        return res.status(400).json({
          message: `Product with ID ${req.body.items[i].productID} not found`,
        });
      }

      items.push({
        productID: product.productID,
        name: product.name,
        price: product.price,
        quantity: req.body.items[i].quantity,
        image: product.images[0],
      });

      total += product.price * req.body.items[i].quantity;
    }

    let name = req.body.name;

    if (name == null) {
      name = req.user.firstName + " " + req.user.lastName;
    }

    const newOrder = new Order({
      orderId: orderId,
      userId: req.user.userId,
      email: req.user.email,
      name: name,
      phone: req.body.phone,
      address: req.body.address,
      total: total,
      items: items,
    });

    await newOrder.save();

    return res
      .status(201)
      .json({ message: "Order created successfully", orderId: orderId });
  } catch (error) {
    console.error("Error generating orderId:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getOrders(req, res) {
  if (req.user == null) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (isAdmin(req)) {
    const orders = await Order.find({}).sort({ date: -1 });
    res.json({ orders });
  } else {
    const orders = await Order.find({ email: req.user.email }).sort({
      date: -1,
    });
    res.json({ orders });
  }
}

export async function updateOrderStatus(req, res) {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const orderId = req.params.orderId;
    const newStatus = req.body.status;
    const notes = req.body.notes;

    const order = await Order.updateOne(
      { orderId: orderId },
      { status: newStatus, notes: notes }
    );
    return res.json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
