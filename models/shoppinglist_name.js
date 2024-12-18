const mongoose = require('mongoose');
const FKHelper = require('../helper/foreign-key-constraint');

const Schema = mongoose.Schema;

const shoppinglistNameSchema = new Schema({
   name: { 
         type: String, 
         required: true 
      },
   _user: { 
         type: Schema.Types.ObjectId, 
         ref:'User', 
         required: true,
         validate: {
            validator: function(v) {
                  return FKHelper(mongoose.model('User'), v);
              },
              message: `User doesn't exist`
          }   
      },
  _store:{ 
         type: Schema.Types.ObjectId, 
         ref:'Store', 
         required:true,
         validate: {
            validator: function(v) {
                  return FKHelper(mongoose.model('Store'), v);
              },
              message: `Store doesn't exist`
          }  
      }
 
}, {timestamps:true});

shoppinglistNameSchema.index({
   name: 1,
   _user: 1
 }, {
   unique: true,
 });

module.exports = mongoose.model('ShoppinglistName', shoppinglistNameSchema);
