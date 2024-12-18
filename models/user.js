const mongoose = require("mongoose");
const mongooseLeanGetters = require("mongoose-lean-getters");
var uniqueValidator = require("mongoose-unique-validator");
const FKHelper = require("../helper/foreign-key-constraint");
const md5 = require("md5");

const Schema = mongoose.Schema;

const bcrypt = require("bcrypt");
const saltRounds = 10;
const childSchema = new Schema({
  address1: {
    type: String,
  },
  address2: {
    type: String,
  },
  name: {
    type: String,
  },
  address_type: {
    type: String,
    enum: ["Home", "Office", "Other"],
    default: "Home",
  },
  is_default: {
    type: Boolean,
    default: false,
  },
  zipcode: {
    type: Number,
  },
  phoneno: {
    type: String,
  },
  countrycode: {
    type: String,
  },
  city: {
    type: String,
  },
  area: {
    type: String,
  },
  emirate: {
    type: String,
  },
  landmark: {
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

const userSchema = Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    stripe_customer_id: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: false,
    },
    profile_pic: {
      type: String,
    },
    password: {
      type: String,
      required: false,
    },
    contact_no: {
      type: String,
      unique: true,
      required: false,
    },
    status: {
      type: Boolean,
      default: false,
    },
    last_login: {
      type: Date,
      get: dateToString,
    },
    ncrStatus: {
      type: String,
      default: false,
    },
    superbuckId: {
      type: Number,
      default: 0,
    },
    dob: {
      type: Date,
      required: false,
    },
    address: [childSchema],
    _timezone: {
      type: String,
    },
    _company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      validate: {
        validator: function (v) {
          return FKHelper(mongoose.model("Company"), v);
        },
        message: `Company doesn't exist`,
      },
    },

    role_id: [
      {
        type: Schema.Types.ObjectId,
        ref: "Role",
        validate: {
          validator: function (v) {
            return FKHelper(mongoose.model("Role"), v);
          },
          message: `Role doesn't exist`,
        },
      },
    ],
    _store: [
      {
        type: Schema.Types.ObjectId,
        ref: "Store",
        validate: {
          validator: function (v) {
            return FKHelper(mongoose.model("Store"), v);
          },
          message: `Store doesn't exist`,
        },
      },
    ],
    last_login: {
      type: Date,
      default: Date.now,
    },
    coupons: [{ type: Schema.Types.ObjectId, ref: "Coupon" }],
    _supervisor: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

userSchema.plugin(mongooseLeanGetters);
userSchema.plugin(uniqueValidator);

userSchema.pre("save", async function () {
  this.password = await md5(this.password);
});

userSchema.post("save", async function (error, doc, next) {
  if (error) {
    console.log("=================", error);
    let userDB = await mongoose.model("User", userSchema).findOne({
      $or: [{ email: doc.email }, { contact_no: doc.contact_no }],
    });

    if (userDB) {
      if (doc.email == userDB.email && doc.contact_no == userDB.contact_no) {
        next(
          new Error(
            "User already exists with this email address and contact no"
          )
        );
      } else if (doc.email == userDB.email) {
        next(new Error("User already exists with this email address "));
      } else if (doc.contact_no == userDB.contact_no) {
        next(new Error("User already exists with this contact number "));
      } else {
        next(
          new Error(
            "User already exists with this email address or contact no "
          )
        );
      }
    }
    // next(
    //   new Error("User already exists with this email address or contact no")
    // );
  } else {
    next(error);
  }
});

function dateToString(date) {
  if (date) return new Date(date).toISOString();
}

module.exports = mongoose.model("User", userSchema);
