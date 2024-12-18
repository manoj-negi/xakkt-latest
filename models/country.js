const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const countrySchema = Schema({
  name: {
    type: String,
    required: true
  },
  iso3: {
    type: String,
    required: true
  },
  iso2: {
      type: String,
      required: true
  },
  phone_code: {
    type: String,
    required: true
 },
 capital: {
    type: String,
    required: true
 },
 currency: {
    type: String,
    required: true
 },
 emojiU: {
    type: String,
    required: true
 },
 emoji: {
    type: String,
    required: true
 }

}, {timestamps:true});

module.exports = mongoose.model('Country', countrySchema);
