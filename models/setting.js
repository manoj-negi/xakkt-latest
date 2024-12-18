const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

let settingSchema = Schema({
    key    : { type: String, required: true, unique:true },
    value  : { type: [String], required: true },
    description : { type: String, defualt: null}
  },{
    timestamps: true
  });

  settingSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Setting', settingSchema);
