const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
const FKHelper = require('../helper/foreign-key-constraint');
const Schema = mongoose.Schema;
const queueSchema = new Schema({ 
    sku:{type: String},
 },{timestamps:true});
module.exports = mongoose.model('Queue', queueSchema);