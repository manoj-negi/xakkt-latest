const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
const mongooseLeanGetters = require('mongoose-lean-getters')
const FKHelper = require('../helper/foreign-key-constraint');
const StoreProductPricing = require("./store_product_pricing");
const ProductRegularPricing = require("./product_regular_pricing");
const Cart = require("./cart");
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2');

const productSchema = new Schema({
  brand_id: {
    type: Schema.Types.ObjectId,
    ref:'Brand'
  },
  deal_id: {
    type: Schema.Types.ObjectId,
    ref:'Deal'
    //required: true,
  },
  _category: {
    type: Schema.Types.ObjectId,
    ref: 'ProductCategory',
    //required: true,
    validate: {
      validator: function(v) {
            return FKHelper(mongoose.model('ProductCategory'), v);
        },
        message: `ProductCategory doesn't exist`
    } 
  },
  _unit: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    // required: true,
    validate: {
      validator: function(v) {
            return FKHelper(mongoose.model('Unit'), v);
        },
        message: `Unit doesn't exist`
    } 
  },
  name:{
      type: Map,
      of: String,
      require:true
  },
  sku:{
    type: String,
    required: false,
  },
  slug: {
    type: String,
    required: false
  },
  description:{
      type: String,
     // required: true
  },
  short_description:{
      type:String,
      //required: true
  },
  weight: {
    type: Number,
    required: false
  },
  cuisine:{
    type:String,
    required:false
  },
  trending:{
    type:Boolean,
    default:false
    },
  valid_from: {
    type: Date,
    //required: true,
    get: dateToString
  },
  valid_till: {
    type: Date,
    //required: true,
    get: dateToString
  },
  is_bestseller: {
    type: Boolean,
    default: false
  },
  is_featured: {
    type: Boolean,
    default:false
  },
  meta_title: {
    type: String,
    default:null
  },
  meta_keywords: {
    type: String,
    default: null
  },
  meta_description: {
    type: String,
    default: null
  },
  price: {
    type: Number,
    //required: true
  },
  image: {
    type: String,
    get: function(value) {
      return `${process.env.IMAGES_BUCKET_PATH}/products/${value}`;
   },
    //required: true
  },
  unit_id: {
    type: Number,
    //required: true
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
  crv: {
    type: String,
    default: null
  },
   status: {
    type: Boolean,
    default: true
  },
  deleted_on:{
    type: Date,
  },
}, {timestamps:true});

productSchema.plugin(mongoosePaginate);

productSchema.pre("deleteOne",  function (next) {
  const _product = this.getQuery()["_id"];
      StoreProductPricing.deleteMany({ _product: _product }).exec()
      ProductRegularPricing.deleteMany({ _product: _product }).exec(),
      Cart.deleteMany({ 'cart._product': _product }).exec(),
 
  next()
});

productSchema.plugin(mongooseLeanGetters)
productSchema.plugin(uniqueValidator)


function dateToString(date){
  if(date) return new Date(date).toISOString();
}

module.exports = mongoose.model('Product', productSchema);
