const Cart = require("../../model/cartModel");
const Product = require("../../model/productModel");
const mongoose = require("mongoose");

const loadCartPage = async (req, res) => {
  try {
    let userData = req.session.user;
    const ID = new mongoose.Types.ObjectId(userData._id);

    let cartProd = await Cart.aggregate([
      {
        $match: {
          userId: ID,
        },
      },
      {
        $lookup: {
          from: "products",
          foreignField: "_id",
          localField: "product_Id",
          as: "productData",
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          quantity: 1,
          value: 1,
          productName: { $arrayElemAt: ["$productData.name", 0] },
          productPrice: { $arrayElemAt: ["$productData.price", 0] },
          productDescription: { $arrayElemAt: ["$productData.description", 0] },
          productImage: { $arrayElemAt: ["$productData.imageUrl", 0] },
          stock: { $arrayElemAt: ["$productData.stock", 0] }
        },
      },
    ]);
    console.log(cartProd);

    cartProd = cartProd.map(item => {
      if (item.stock <= 0) {
        item.outOfStock = true; // Add outOfStock flag if product is out of stock
      }
      return item;
    });

    const subTotal = await Cart.aggregate([
      {
        $match: {
          userId: ID,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$value" },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
        },
      },
    ]);
    console.log(subTotal, "SUBTOTAL");

    console.log(cartProd);
    if (cartProd.length > 0) {
      res.render("user/cart", {
        userData,
        cartProd,
        subTotal: subTotal[0].total,
      });
    } else {
      res.render("user/emptyCart", { userData });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const addToCart = async (req, res) => {
  try {
    let userData = req.session.user;
    if (!userData) {
      console.log("userdata..............");
      return res
        .status(401)
        .json({ success: false, message: "Login Required" });
    }

    console.log("User ID:", userData._id);
    const data = req.body;
    console.log("Request Body:", data);
    const quantity = parseInt(req.body.quantity, 10);
    console.log("Quantity:", quantity);

    if (!data.prodId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    if (quantity <= 0) {
      return res.json({
        success: false,
        message: "Quantity cannot be Zero or Negative!!!",
      });
    }

    const sampProd = await Product.findOne({ _id: data.prodId }).lean();
    console.log("Product Data:", sampProd);

    if (!sampProd) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const ProductExist = await Cart.find({
      userId: userData._id,
      product_Id: data.prodId,
    }).lean();
    console.log("Product Exist in Cart:", ProductExist);

    if (ProductExist.length > 0) {
      return res.json({
        success: false,
        message: "Product already exists in cart",
      });
    }

    const cartData = await Cart.findOneAndUpdate(
      {
        userId: userData._id,
        product_Id: data.prodId,
      },
      {
        quantity: quantity,
        price: sampProd.price,
        value: sampProd.price * quantity,
      },
      { new: true, upsert: true }
    );

    console.log("Cart Data:", cartData);

    if (cartData) {
      res.json({
        success: true,
        message: "Product added to cart",
        cartItem: cartData,
      });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Failed to add product to cart" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userData = req.session.user;
    const { id } = req.body;
    const removeCartItem = await Cart.findByIdAndDelete({ _id: id });
    if (removeCartItem) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const updateCart = async (req, res) => {
  try {
    const userData = req.session.user;
    const ID = new mongoose.Types.ObjectId(userData._id);
    const { cartIdForUpdate } = req.body;
    const oldCart = await Cart.findOne({ _id: req.body.cartIdForUpdate });
    console.log(cartIdForUpdate, oldCart);

    const price = oldCart.price;

    const newValue = req.body.newValue * price;
    console.log(cartIdForUpdate, newValue);
    let cartquant = await Product.findOne(
      { _id: oldCart.product_Id },
      { stock: 1, _id: 0 }
    ).lean();
    console.log(
      cartquant.stock,
      "cartquant--------------------------------------------------------------"
    );

    if (req.body.newValue > 4) {
      return res.json({
        success: false,
        message: "You can only choose up to 4 units of this product.",
      });
    }

    if (req.body.newValue > cartquant.stock) {
      return res.json({
        success: false,
        message: "Product stock limit reached!",
      });
    }

    const updatedcartvalue = await Cart.updateOne(
      { _id: req.body.cartIdForUpdate },
      { $set: { quantity: req.body.newValue, value: newValue } }
    );
    console.log(updatedcartvalue);
    const updatedCart = await Cart.find({
      _id: req.body.cartIdForUpdate,
    }).lean();
    const subTotal = await Cart.aggregate([
      {
        $match: {
          userId: ID,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$value" },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
        },
      },
    ]);
    console.log(subTotal, "SUBTOTAL");

    const newData = [];

    updatedCart.forEach((data) => {
      const newDataItem = { ...data };

      // if (data.totalAmount) {
      //   newDataItem.totalAmount = newValue;
      // } else {
      //   newDataItem.totalAmount = newValue;
      // }
      if (data.stock <= 0) {
    newDataItem.totalAmount = "Out of Stock";  // Set totalAmount to a string if out of stock
    newDataItem.outOfStock = true; // Mark the product as out of stock
  } else {
    // Calculate the total amount if the product is in stock
    newDataItem.totalAmount = newValue;
  }

      newData.push(newDataItem);
    });
    console.log(newData, "itemsitemssss");
    const cartValue = newData.reduce((acc, item) => acc + item.totalAmount, 0);
    console.log(cartValue);
    res.json({
      success: true,
      message: "updated",
      cartProd: newData,
      items: newData,
      cartValue: subTotal,
    });

    console.log(newData[0].totalAmount);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};




const checkOutOfStock = async (req, res) => {
  try {
    const userData = req.session.user;
    const cartItems = await Cart.find({ userId: userData._id }).lean(); 

    if (cartItems.length === 0) {
      return res.json({ success: false, message: "Your cart is empty." });
    }

    let outOfStockProducts = [];

    for (let item of cartItems) {
      const product = await Product.findById(item.product_Id).lean();
      if (product.stock <= 0) {        
        outOfStockProducts.push(product.name);
      }
    }

    if (outOfStockProducts.length > 0) {      
      return res.json({
        success: false,
        message: `The following products are out of stock: ${outOfStockProducts.join(", ")}. Please remove them from your cart to proceed.`,
      });
    }
    
    res.json({
      success: true,
      message: "All products are in stock. You can proceed to checkout.",
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  loadCartPage,
  addToCart,
  removeFromCart,
  updateCart,
  checkOutOfStock
};
