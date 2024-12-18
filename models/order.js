const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const FKHelper = require("../helper/foreign-key-constraint");
var uniqueValidator = require("mongoose-unique-validator");
const mongooseLeanGetters = require("mongoose-lean-getters");

const addressSchema = new Schema({
  address1: {
    type: String,
  },
  address2: {
    type: String,
  },
  address_type: {
    type: String,
    enum: ["home", "office", "other"],
    default: "home",
  },
  zipcode: {
    type: Number,
  },
  phoneno: {
    type: Number,
  },
  countrycode: {
    type: String,
  },
  city: {
    type: String,
  },
  emirate: {
    type: String,
  },
  country: {
    type: String,
  },

  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: false,
    },
    coordinates: {
      type: [Number],
      required: false,
    },
  },
});

const OrderSchema = Schema(
  {
    _user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator: function (v) {
          return FKHelper(mongoose.model("User"), v);
        },
        message: `User doesn't exist`,
      },
    },
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
    shipping: {
      address: addressSchema,
      delivery_notes: { type: String },
      order_id: { type: String, required: true, unique: true },
      tracking: {
        company: { type: String },
        tracking_number: { type: String },
        status: {
          type: String,
          enum: [
            "pending",
            "recieved",
            "dispatched",
            "cancelled",
            "delivered",
            "refunded",
            "disputed",
          ],
          default: "pending",
          required: true,
        },
        estimated_delivery: { type: String },
      },
    },
    payment: {
      method: {
        type: Number,
        enum: [0, 1],
        required: true,
      },
      transaction_id: { type: String },
      customer_id: { type: String },
      payment_date: { type: String },
    },
    feedback: {
      rating: { type: Number, default: 0 },
      comment: { type: String, default: null },
    },
    products: [
      {
        quantity: { type: Number, required: true },
        _product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
          validate: {
            validator: function (v) {
              return FKHelper(mongoose.model("Product"), v);
            },
            message: `Product doesn't exist`,
          },
        },
        deal_price: {
          type: mongoose.Decimal128,
          get: function (value) {
            return value.toString();
          },
          required: true,
        },
        regular_price: {
          type: mongoose.Decimal128,
          get: function (value) {
            return value.toString();
          },
          required: true,
        },
      },
    ],
    delivered_on: { type: Date, required: false },
    total_cost: {
      type: mongoose.Decimal128,
      get: function (value) {
        return value.toString();
      },
      required: true,
    },
  },
  { timestamps: true }
);
OrderSchema.plugin(mongooseLeanGetters);
OrderSchema.plugin(uniqueValidator);
module.exports = mongoose.model("orders", OrderSchema);
