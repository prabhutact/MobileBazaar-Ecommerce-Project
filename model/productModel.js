const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
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

    isBlocked: {
      type: Boolean,
      default: false,
  }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);


