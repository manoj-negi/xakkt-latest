const Order = require("../../models/order");
const User = require("../../models/user");
var moment = require("moment");
const { validationResult } = require("express-validator");
const orderid = require("order-id")(process.env.ORDER_SECRET);
const _time = require("../../helper/storetimezone");
const mongoose = require("mongoose");
const _global = require("../../helper/common");
const Store = require("../../models/store");
const Product = require("../../models/product");
const Cart = require("../../models/cart");
const pushController = require("./pushController");

(exports.listOrders = async (req, res) => {
  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const orderInfo = {
      _user: req.decoded.id,
      _store: req.params.storeid,
    };
    await _time.store_time(req.params.storeid);
    var order = await Order.find(orderInfo).lean();
    if (!order.length) return res.json({ message: "No Order found", data: "" });
    return res.json({ status: 1, message: "Order Listing", data: order });
  } catch (err) {
    return res.status(400).json({ data: err.message });
  }
}),
  (exports.orderDetails = async (req, res) => {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      var order = await Order.findById(req.params.orderid).lean();
      console.log(order);
      if (!order) return res.json({ message: "No Order found", data: "" });
      return res.json({ status: 1, message: "", data: order });
    } catch (err) {
      return res.status(400).json({ data: err.message });
    }
  }),
  (exports.rateOrder = async (req, res) => {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      var order = await Order.findByIdAndUpdate(
        req.params.orderid,
        {
          $set: {
            "feedback.rating": req.body.rating,
            "feedback.comment": req.body.comment,
          },
        },
        { new: true }
      ).lean();
      if (!order) return res.json({ message: "No Order found", data: "" });
      return res.json({ status: 1, message: "", data: order });
    } catch (err) {
      return res.status(400).json({ data: err.message });
    }
  });

(exports.updateOrderStatus = async (req, res) => {
  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    var order = await Order.findByIdAndUpdate(
      req.params.orderid,
      { $set: { "shipping.tracking.status": req.body.status } },
      { new: true }
    ).lean();
    console.log(order);
    if (!order) return res.json({ message: "No Order found", data: "" });
    else {
      await pushController.firebase(req, "Order is" + req.body.status);
      return res.json({ status: 1, message: "", data: order });
    }
  } catch (err) {
    return res.status(400).json({ data: err.message });
  }
}),
  // (exports.placeOrder = async (req, res) => {
  //   // console.log(req);
  //   // return;
  //   const errors = await validationResult(req);
  //   if (!errors.isEmpty()) {
  //     return res.status(400).json({ errors: errors.array() });
  //   }

  //   try {
  //     var user = await User.findOne(
  //       { _id: req.session.userid },
  //       {
  //         address: {
  //           $elemMatch: { _id: mongoose.Types.ObjectId(req.body.address) },
  //         },
  //       }
  //     ).lean();
  //     console.log(req);
  //      user.address = '123 Road'
  //     if (user.address === undefined) {
  //       return res.json({ status: 0, message: "address not found" });
  //     }
  //     delete user.address[0]._id;
  //     var address = { ...user.address[0] };

  //     var product = [];
  //     const charge = req.charge;

  //     await Promise.all(
  //       req.body.products.map(async (element) => {
  //         var data = {};
  //         var productId = element._product;
  //         var productPrice = await _global.productprice(
  //           req.body._store,
  //           productId
  //         );

  //         if (productPrice) {
  //           data = {
  //             ...data,
  //             _product: productId,
  //             quantity: element.quantity,
  //             deal_price: productPrice.deal_price,
  //             regular_price: productPrice.regular_price,
  //           };
  //         } else {
  //           data = {
  //             ...data,
  //             _product: productId,
  //             quantity: element.quantity,
  //             deal_price: 0,
  //             regular_price: 0,
  //           };
  //         }
  //         product.push(data);
  //       })
  //     );

  //     var orderInfo = {
  //       _user: req.session.userid,
  //       _store: req.body._store,
  //       shipping: {
  //         address: address,
  //         delivery_notes: req.body.delivery_notes ?? null,
  //         order_id: orderid.generate(),
  //       },

  //       payment: {
  //         method: req.body.payment_method,
  //         transaction_id: charge.id,
  //       },
  //       products: product,
  //       total_cost: req.body.total_cost,
  //     };

  //     await Order.create(orderInfo);
  //     await Cart.deleteOne({
  //       _user: req.session.userid,
  //       _store: req.body._store,
  //     }).exec();
  //     await pushController.firebase(req, "New Order Placed");
  //     return res.redirect("/myorders/" + req.body.slug);
  //   } catch (err) {
  //     console.log("---value", err);
  //     return res.status(400).json({ data: err.message });
  //   }
  // });

  exports.placeOrder = async (req, res) => {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    try {
      // Fetch the user and address
      var user = await User.findOne(
        { _id: req.session.userid },
        {
          address: {
            $elemMatch: { _id: mongoose.Types.ObjectId(req.body.address) },
          },
        }
      ).lean();
  
      if (!user.address){
        user.address = '123 Road'
      }
      
      if (!user || !user.address || user.address.length === 0) {
        return res.json({ status: 0, message: "Address not found" });
      }
  
      // Assuming the address is correctly fetched, use it
      const address = { ...user.address[0] };
      delete address._id; // Remove _id from address if needed
  
      // Initialize product array
      var product = [];
      const charge = req.charge;
  
      // Loop through the products to calculate product prices
      await Promise.all(
        req.body.products.map(async (element) => {
          var data = {};
          var productId = element._product;
          var productPrice = await _global.productprice(req.body._store, productId);
  
          if (productPrice) {
            data = {
              ...data,
              _product: productId,
              quantity: element.quantity,
              deal_price: productPrice.deal_price,
              regular_price: productPrice.regular_price,
            };
          } else {
            data = {
              ...data,
              _product: productId,
              quantity: element.quantity,
              deal_price: 0,
              regular_price: 0,
            };
          }
          product.push(data);
        })
      );
  
      // Ensure total_cost is a number and not an array
      let total_cost = Array.isArray(req.body.total_cost) ? req.body.total_cost.reduce((acc, val) => acc + parseFloat(val), 0) : parseFloat(req.body.total_cost);
  
      var orderInfo = {
        _user: req.session.userid,
        _store: req.body._store,
        shipping: {
          address: address,
          delivery_notes: req.body.delivery_notes ?? null,
          order_id: orderid.generate(),
        },
        payment: {
          method: req.body.payment_method,
          transaction_id: charge.id,
        },
        products: product,
        total_cost: total_cost, // Ensure total_cost is a single number
      };
  
      // Create the order in the database
      await Order.create(orderInfo);
  
      // Delete the cart
      await Cart.deleteOne({
        _user: req.session.userid,
        _store: req.body._store,
      }).exec();
  
      // Notify via Firebase
      await pushController.firebase(req, "New Order Placed");
  
      // Redirect to the user's orders page
      return res.redirect("/myorders/" + req.body.slug);
  
    } catch (err) {
      console.log("---value", err);
      return res.status(400).json({ data: err.message });
    }
  };
  
(exports.myorder = async (req, res) => {
  try {
    if (!res.locals.userid) {
      return res.json({ status: 0, message: "You are not logged in" });
    }

    var store = await Store.findOne({ slug: req.params.store }).lean();
    var order = await Order.find({
      _user: res.locals.userid,
      _store: store._id,
    })
      .select("-feedback -createdAt -updatedAt -__v")
      .populate({
        path: "products._product",
        select: "name description _category weight _unit image quantity",
        populate: {
          path: "_unit",
          select: "name",
        },
      })
      .populate("_store", "name currency")
      .lean({ getters: true });

    var random = Math.floor(Math.random() * 5);
    var products = await Product.find().skip(random).limit(2).lean();

    return res.render("frontend/order-listing", {
      orders: order,
      products: products,
      store: store,
    });
  } catch (err) {
    return res.status(400).json({ data: err.message });
  }
}),
  (exports.addresslist = async (req, res) => {
    try {
      if (req.query.default) {
        var defaultAddress = await User.findOne(
          { _id: req.decoded.id },
          { address: { $elemMatch: { is_default: req.query.default } } }
        ).lean();
        if (!defaultAddress.address) {
          return res.json({
            status: 0,
            message: "No default address added for you",
          });
        }
        return res.json({ data: defaultAddress });
      }

      let user = await User.findOne(
        { _id: req.decoded.id },
        "contact_no email first_name last_name address"
      )
        .select("-_id")
        .lean();
      // let user = await User.findOne({ _id: req.decoded.id }).select('-_id -password -role_id -coupons -last_login -updatedAt -createdAt -ncrStatus').lean()

      if (!user) return res.json({ status: 0, message: "Data not found" });
      return res.json({ state: 1, data: user });
    } catch (err) {
      console.log("--err", err);
      return res.status(404).json({ message: err.message });
    }
  });
