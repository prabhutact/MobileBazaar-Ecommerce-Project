const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },

    imageUrl: {
      type: Array,
      required: true,
    },

    stock: {
      type: Number,
      required: true,
    },
    productOfferId:{
      type: mongoose.Types.ObjectId,
      default: null
    },
    productOfferPercentage:{
      type:Number,
      default: null
    },
    discountedPrice: { 
      type: Number 
    },
    popularity: {
      type: Number,
      default: 0,
    },
    bestSelling:{
      type:Number,
      default:0
  },

    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Product", productSchema);
