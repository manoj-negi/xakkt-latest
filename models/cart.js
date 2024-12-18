const mongoose = require("mongoose");
const FKHelper = require("../helper/foreign-key-constraint");

const Schema = mongoose.Schema;

const cartSchema = new Schema(
  {
    _user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      validate: {
        validator: function (v) {
          if (v == null) return;
          return FKHelper(mongoose.model("User"), v);
        },
        message: `User doesn't exist`,
      },
    },
    sessionId: {
      type: String,
      unique: true,
      required: false,
    },
    cart: [
      {
        _product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: { type: Number },
        total_price: { type: Number },
      },
    ],
    _store: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      validate: {
        validator: function (v) {
          return FKHelper(mongoose.model("Store"), v);
        },
        message: `Store doesn't exist`,
      },
    },
    _coupon: [
      {
        coupon_id: {
          type: Schema.Types.ObjectId,
          ref: "Coupon",
          required: false,
        },
        discounted_price: { type: Number },
      },
    ],
    valid_till: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("cart", cartSchema);
