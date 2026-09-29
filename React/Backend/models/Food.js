const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    description: {
      type: String,
      default: ""
    },

    image: {
      type: String,
      default: ""
    },

    available: {
      type: Boolean,
      default: true
    },

    isVeg: {
      type: Boolean,
      default: true
    },

    rating: {
      type: Number,
      default: 4.5
    },

    prepTime: {
      type: String,
      default: "10 mins"
    },

    badge: {
      type: String,
      default: ""
    },

    spicyLevel: {
      type: Number,
      default: 0
    }
  },

  {
    timestamps: true
  }
);

module.exports = mongoose.model("Food", foodSchema);