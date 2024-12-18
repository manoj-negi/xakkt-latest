const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

const currencySchema = Schema({
  name: {
    type: String,
    unique:true,
    required: true
  },
}, {timestamps:true});
currencySchema.plugin(uniqueValidator)

module.exports = mongoose.model('Currency', currencySchema);
