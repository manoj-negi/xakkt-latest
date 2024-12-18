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
const { ObjectId } = require("bson");
const pushController = require("./pushController");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

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
    var orders = await Order.find(orderInfo)
      .populate("_store", "name")
      .lean({ getters: true });

    if (!orders.length)
      return res.json({ message: "No Order found", data: "" });
    return res.json({ status: 1, message: "Order Listing", data: orders });
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
      return res.status(400).json({ status: 0, data: err.message });
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
    await pushController.firebase(req.decoded.id, "Order" + req.body.status);
    if (!order) return res.json({ message: "No Order found", data: "" });
    return res.json({ status: 1, message: "", data: order });
  } catch (err) {
    return res.status(400).json({ status: 0, data: err.message });
  }
}),
  (exports.creatOrder = async (req, res) => {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 0, errors: errors.array() });
    }

    try {
      var user = await User.findOne(
        { _id: req.decoded.id },
        {
          address: {
            $elemMatch: { _id: mongoose.Types.ObjectId(req.body.address) },
          },
        }
      ).lean();

      if (user.address === undefined) {
        return res.json({ status: 0, message: "address not found" });
      }
      delete user.address[0]._id;
      var address = { ...user.address[0] };

      var product = [];
      await Promise.all(
        req.body.products.map(async (element) => {
          var data = {};
          var productId = element._product;
          var productPrice = await _global.productprice(
            req.body._store,
            productId
          );

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

      var orderInfo = {
        _user: req.decoded.id,
        _store: req.body._store,
        shipping: {
          address: address,
          delivery_notes: req.body.delivery_notes ?? null,
          order_id: orderid.generate(),
          tracking: {
            status: "recieved",
          },
        },
        payment: {
          method: req.body.payment_method,
          transaction_id: req.body.transaction_id,
        },
        products: product,
        total_cost: req.body.total_cost.toFixed(2),
      };

      var order = await Order.create(orderInfo);
      await pushController.firebase(req.decoded.id, "Order Created");

      // if (req.body.transaction_id) {
      //   console.log("df");
      //   await Order.updateOne(
      //     { _id: orderInfo._id },
      //     {
      //       shipping: {
      //         tracking: {
      //           status: "Succeded",
      //         },
      //         order_id: orderInfo.shipping.order_id,
      //       },
      //       payment: {
      //         transaction_id: req.body.transaction_id,
      //       },
      //     },
      //     { new: true }
      //   ).lean();
      // }

      return res.json({
        status: 1,
        message: "Order createddd",
        data: { order_id: orderInfo.shipping.order_id },
      });
    } catch (err) {
      console.log("---value", err);
      return res.status(400).json({ status: 0, data: err.message });
    }
  });
exports.myorder = async (req, res) => {
  try {
    var order = await Order.find({ _user: req.decoded.id })
      .select("-feedback")
      .populate({
        path: "products._product",
        select: "name description _category weight _unit image quantity",
        populate: {
          path: "_unit",
          select: "name",
        },
      })
      .populate("_store", "name")
      .lean({ getters: true });

    order.map((element) => {
      for (const [i, product] of element.products.entries()) {
        delete product._id;
        product._id = product._product._id;
        product.name = product._product.name;
        product.description = product._product.description;
        product._category = product._product._category;
        product.weight = product._product.weight;
        product._unit = product._product._unit;
        product.image = product._product.image;
        /*product._product.deal_price= product.deal_price
                product._product.regular_price= product.regular_price*/

        delete product._product;
      }
    });

    // console.log(order)
    if (!order.length)
      return res.json({ status: 1, message: "No Order found", data: [] });
    return res.json({ status: 1, message: "", data: order });
  } catch (err) {
    return res.status(400).json({ data: err.message });
  }
};

exports.orderAgainList = async (req, res) => {
  try {
    var order = await Order.find({ _user: req.decoded.id })
      .select("-feedback -shipping -_user -payment")
      .populate({
        path: "products._product",
        select: "name description _category weight _unit image quantity",
        populate: {
          path: "_unit",
          select: "name",
        },
      })
      .populate("_store", "name")
      .lean({ getters: true });

    prodArray = [];

    order.map((element) => {
      for (const [i, product] of element.products.entries()) {
        delete product._id;
        product._id = product._product._id;
        product.name = product._product.name;
        product.description = product._product.description;
        product._category = product._product._category;
        product.weight = product._product.weight;
        product._unit = product._product._unit;
        product.image = product._product.image;
        /*product._product.deal_price= product.deal_price
                product._product.regular_price= product.regular_price*/

        delete product._product;
        prodArray.push(product);
      }
    });

    arrUniq = [...new Map(prodArray.map((v) => [v._id, v])).values()];

    // console.log(order)
    if (!order.length)
      return res.json({ status: 1, message: "No Order found", data: [] });
    return res.json({ status: 1, message: "", data: arrUniq });
  } catch (err) {
    return res.status(400).json({ data: err.message });
  }
};

exports.orderAgainListk = async (req, res) => {
  try {
    var order = await Order.aggregate([
      { $match: { _user: ObjectId(req.decoded.id) } },

      {
        $lookup: {
          from: "products",
          localField: "products._product",
          foreignField: "_id",
          as: "products",
        },
      },
      {
        $unwind: "$products",
      },

      {
        $group: {
          _id: "$products._id",
          name: { $first: "$products.name" },
          image: { $first: "$products.image" },
          description: { $first: "$products.description" },
          cuisine: { $first: "$products.cuisine" },
          price: { $first: "$products.price" },
          brand_id: { $first: "$products.brand_id" },
          _category: { $first: "$products._category" },
          _user: { $first: "$_user" },
          _store: { $first: "$_store" },
          feedback: { $first: "$feedback" },
          address: { $first: "$shipping.address" },
        },
      },
    ]);

    if (!order.length)
      return res.json({ status: 1, message: "No Order found", data: [] });
    return res.json({ status: 1, message: "", data: order });
  } catch (err) {
    return res.status(400).json({ data: err.message });
  }
};
exports.orderSuccess = async (req, res) => {
  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 0, errors: errors.array() });
  }
  const orderID = req.params.id;
  const order_id = req.body.order_id;
  const transaction_id = req.body.transaction_id;
  const status = req.body.status;
  try {
    const orderUpdate = await Order.updateOne(
      { _id: orderID },
      {
        shipping: {
          tracking: {
            status: status,
          },
          order_id: order_id,
        },
        // "shipping.tracking.status": status,
        // "shipping.order_id": order_id,
        payment: {
          transaction_id: transaction_id,
        },
      },
      { new: true }
    ).lean();
    console.log(orderUpdate);
    if (!orderUpdate) return res.json({ message: "No Order found", data: "" });
    return res.json({ status: 1, message: "Order Updated", data: orderUpdate });
  } catch (err) {
    return res.status(400).json({ data: err.message });
  }
};
exports.placeOrder = async (req, res) => {
  // console.log(req);
  // return;
  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    var user = await User.findOne(
      { _id: req.decoded.id },
      {
        address: {
          $elemMatch: { _id: mongoose.Types.ObjectId(req.body.address) },
        },
      }
    ).lean();
    if (user.address === undefined) {
      return res.json({ status: 0, message: "address not found" });
    }
    delete user.address[0]._id;
    var address = { ...user.address[0] };

    var product = [];
    const charge = req.charge;
    const cart = await Cart.findOne({
      _id: req.body.cartid,
    }).lean();
    await Promise.all(
      cart.cart.map(async (element) => {
        var data = {};
        var productId = element._product;
        var productPrice = await _global.productprice(cart._store, productId);

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

    var orderInfo = {
      _user: req.decoded.id,
      _store: cart._store,
      shipping: {
        address: address,
        delivery_notes: req.body.delivery_notes ?? null,
        order_id: orderid.generate(),
      },

      payment: {
        method: 0,
        transaction_id: charge.id,
      },
      products: product,
      total_cost: req.total,
      // total_cost: req.body.total_cost,
    };

    await Order.create(orderInfo);

    await Cart.deleteOne({
      _id: req.body.cartid,
    }).exec();
    return true;
    // return res.json({
    //   status: 1,
    //   data: req.body.slug,
    // });
    // return res.redirect("/myorders/" + req.body.slug);
  } catch (err) {
    console.log("---value", err);
    return false;

    // return res.status(400).json({ data: err.message });
  }
};
exports.orderCancel = async (req, res) => {
  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const orderID = req.params.id;

  try {
    const orderData = await Order.findOne({ _id: orderID });
    if (!orderData) return res.json({ message: "No Order found", data: "" });

    if (orderData.payment.transaction_id) {
      const refund = await stripe.refunds.create({
        payment_intent: orderData.payment.transaction_id,
      });
    }
    await Order.updateOne(
      { _id: orderID },
      {
        shipping: {
          tracking: {
            status: "cancelled",
          },
          order_id: orderData.shipping.order_id,
        },
      },
      { new: true }
    );

    // else {
    //   return res.json({
    //     message: "No Payment method for this order",
    //     data: "",
    //   });
    // }

    return res.json({
      status: 1,
      message: "Order Cancel Successfully",
      // data: refundCreate,
    });
  } catch (err) {
    res.send(err);
  }
};
