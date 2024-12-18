const Product = require('../../models/product');
const { validationResult } = require('express-validator');
const _global = require('../../helper/common');
const Cart = require('../../models/cart')
const User = require('../../models/user')
var ObjectId = require('mongoose').Types.ObjectId;
const Store = require('../../models/store');

exports.saveCard = async (req, res) => {
    try {
		
    	 let condition = {_store:req.body.storeid}
		 condition = (req.session.userid)?{ ...condition, _user: req.session.userid} : { ...condition, sessionId: req.sessionID} ;

		 var cartProducts = await Cart.findOne(condition).populate({
			 path: 'cart',
			 populate: {
				 path: '_product',
				 model: Product,
				 select:'name image unit'
			 }
			}).lean();

		if(cartProducts?.cart.length)return res.json({status:1,data:cartProducts.cart})
		return res.json({status:0,data:[]})
	}
    catch (err) {
		console.log("--err", err)
		return res.status(400).json({ data: "Something Went Wrong" });
    }
}

exports.addPoductToCart = async (req, res) => {
    try {

        const errors = await validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
	
		var productInfo = await Product.findById(req.body._product);
		let productprice = await _global.productprice(req.body._store, req.body._product)
		if (!productprice) return res.json({ status: 0, message: "Product Price of this id not set yet" })
		if (!productInfo) return res.json({ status: 0, message: "Product with this id not exists" })
		
		
		var data = {
			_product: req.body._product,
			quantity: req.body.quantity,
			total_price: productprice.effective_price * req.body.quantity
		}

		let  condition = { _store: req.body._store }
		condition = (req.session.userid)?{ ...condition, _user: req.session.userid} : { ...condition, sessionId: req.sessionID} ;

		let getProdCond = {...condition, cart: { $elemMatch: { _product: req.body._product } }};
		
		var total_quantity;
       	var product = await Cart.findOne(getProdCond);
		

		if (product?.cart) {
			
			await Cart.findOneAndUpdate(condition, { $pull: { cart: { _product:req.body._product } } });
			var data = await Cart.findOne({ _user: req.session.userid, _store: req.body._store }).lean();
			total_quantity = data.cart.map(product => product.quantity).reduce(function (acc, cur) {
				return acc + cur;
			})
			var message= "Product removed from cart" ;
	
		} else {
			
			await Cart.findOneAndUpdate(condition, { $push: { cart: data } },{ upsert: true }).lean();
			var data = await Cart.findOne({ _user: req.session.userid, _store: req.body._store }).lean();
			total_quantity = data.cart.map(product => product.quantity).reduce(function (acc, cur) {
				return acc + cur;
			})
			var message= "Product added to the cart" ;
			
		}

		return res.json({ status: 1, message: message,data:{iscart:1,total_products:total_quantity} })
		
	} catch (err) {
		console.log("--errr", err)
		return res.status(400).json({ data: "Something Went Wrong" });
	}

};


