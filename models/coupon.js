const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const couponSchema = Schema(
  {
    coupon_code: {
      type: String,
      required: true,
    },
    apply: {
      type: String,
      enum: ["fixed", "percent"],
      default: "percent",
    },
    amount: {
      type: Number,
      required: true,
    },
    min_amount: {
      type: Number,
      required: true,
    },
    _store: {
      type: String,
      // required: true
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
