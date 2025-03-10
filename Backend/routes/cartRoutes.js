const express = require("express");
const router = express.Router();
const pool = require("../database");

// Add item to cart
router.post("/add", async (req, res) => {
  try {
    console.log("Received cart request:", req.body);
    const { prod_id, user_id } = req.body;
    
    if (!prod_id || !user_id) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields"
      });
    }

    // // Check if product is already in the cart
    // const cartCheck = await pool.query(
    //   "SELECT * FROM shopping_cart WHERE user_id = $1 AND prod_id = $2",
    //   [user_id, prod_id]
    // );

    // if (cartCheck.rows.length > 0) {
    //   return res.status(400).json({
    //     status: "error",
    //     message: "Product is already in the cart"
    //   });
    // }

    // Validate product exists
    const productCheck = await pool.query(
      "SELECT prod_id FROM product WHERE prod_id = $1",
      [prod_id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Product not found"
      });
    }

    const newCartItem = await pool.query(
      "INSERT INTO shopping_cart (prod_id, user_id) VALUES ($1, $2) RETURNING *",
      [prod_id, user_id]
    );

    res.status(201).json({
      status: "success",
      data: newCartItem.rows[0],
      message: "Item added to cart successfully"
    });
  } catch (err) {
    console.error("Cart error:", err);
    res.status(500).json({
      status: "error",
      message: err.message || "Server error while adding item to cart"
    });
  }
});

// Get cart items for a user
router.get("/items/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const cartItems = await pool.query(
      `SELECT sc.cart_id, p.* 
       FROM shopping_cart sc 
       JOIN product p ON sc.prod_id = p.prod_id 
       WHERE sc.user_id = $1`,
      [userId]
    );

    res.status(200).json({
      status: "success",
      data: cartItems.rows,
      message: "Cart items retrieved successfully"
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      status: "error",
      message: "Server error while retrieving cart items"
    });
  }
});

// Check if product is in cart
router.get("/check/:userId/:prodId", async (req, res) => {
  try {
    const { userId, prodId } = req.params;
    
    const cartItem = await pool.query(
      "SELECT * FROM shopping_cart WHERE user_id = $1 AND prod_id = $2",
      [userId, prodId]
    );

    if (cartItem.rows.length > 0) {
      return res.status(200).json({
        status: "success",
        data: cartItem.rows[0],
        message: "Product is already in the cart"
      });
    } else {
      return res.status(404).json({
        status: "error",
        message: "Product not found in the cart"
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      status: "error",
      message: "Server error while checking cart"
    });
  }
});

// Remove item from cart
router.delete("/remove/:cartId", async (req, res) => {
  try {
    const { cartId } = req.params;
    
    const deletedItem = await pool.query(
      "DELETE FROM shopping_cart WHERE cart_id = $1 RETURNING *",
      [cartId]
    );

    if (deletedItem.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Cart item not found"
      });
    }

    res.status(200).json({
      status: "success",
      data: deletedItem.rows[0],
      message: "Item removed from cart successfully"
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      status: "error",
      message: "Server error while removing item from cart"
    });
  }
});

// Clear cart items for a user
router.delete("/clear/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const deletedItems = await pool.query(
      "DELETE FROM shopping_cart WHERE user_id = $1 RETURNING *",
      [userId]
    );

    res.status(200).json({
      status: "success",
      data: deletedItems.rows,
      message: "Cart cleared successfully"
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      status: "error",
      message: "Server error while clearing cart"
    });
  }
});

module.exports = router;
