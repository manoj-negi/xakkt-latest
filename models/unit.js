const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;


const unitSchema = new Schema({ 
    name:{type: String, required: true},
    description:{
        type:String
    }
 },{timestamps:true});

 unitSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Unit', unitSchema);