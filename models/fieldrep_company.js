const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
const FKHelper = require('../helper/foreign-key-constraint');
const Schema = mongoose.Schema;
const StoreProductPricing = require("./store_product_pricing");
const ProductRegularPricing = require("./product_regular_pricing");
const Order = require("./order");
const Cart = require("./cart");
const Banner = require("./banner");




const storeSchema = new Schema({
    name: { type: String, required: false },
    
    _currency: {
        type: Schema.Types.ObjectId,
        ref: 'Currency',
        required: false,
        validate: {
            validator: function (v) {
                return FKHelper(mongoose.model('Currency'), v);
            },
            message: `Currency doesn't exist`
        }
    },
    _user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        validate: {
            validator: function (v) {
                return FKHelper(mongoose.model('User'), v);
            },
            message: `User doesn't exist`
        }
    },
    _timezone: {
        type: String
    },
    address: {
        type: String,
        required: false
    },
    city: {
        type: String,
        required: false
    },
    state: {
        type: String,
        required: false
    },
    _country: {
        type: Schema.Types.ObjectId,
        ref: 'Country',
        validate: {
            validator: function (v) {
                return FKHelper(mongoose.model('Country'), v);
            },
            message: `Country doesn't exist`
        }
    },
    lastupdatedby: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        validate: {
            validator: function (v) {
                return FKHelper(mongoose.model('User'), v);
            },
            message: `User doesn't exist`
        }
    },
    zipcode: {
        type: String,
        required: false
    },
    _company:
    {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        validate: {
            validator: function (v) {
                return FKHelper(mongoose.model('Company'), v);
            },
            message: `Company doesn't exist`
        }
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: false
        },
        coordinates: {
            type: [Number],
            required: false
        }

    },
    contact_no: {
        type: String,
        required: false
    },
    time_schedule: {
        Monday: { startTime: String, endTime: String },
        Tuesday: { startTime: String, endTime: String },
        Wednesday: { startTime: String, endTime: String },
        Thursday: { startTime: String, endTime: String },
        Friday: { startTime: String, endTime: String },
        Saturday: { startTime: String, endTime: String },
        Sunday: { startTime: String, endTime: String }
    },
    holidays: [
        {
            startDate: Date,
            endDate: Date,
            message: String
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema);