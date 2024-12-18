const Cart = require("../../models/cart");
const Product = require("../../models/product");
const Coupon = require("../../models/coupon");
const mongoose = require("mongoose");

var moment = require("moment");
const { validationResult } = require("express-validator");
const _global = require("../../helper/common");
const { disconnect } = require("mongoose");
exports.list = async (req, res) => {
  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    let coupon = await Coupon.find({ _store: req.params.store }).lean();
    console.log(coupon);
    if (!coupon) return res.json({ message: "Data not found", data: [] });
    return res.json({ messag: "Listing of coupons", data: coupon });
  } catch (err) {
    return res.status(400).json({ data: err.message });
  }
};
exports.applycoupon = async (req, res) => {
  try {
    let cart = await Cart.findOne({ _id: req.body._cart }).lean();
    if (!cart) {
      return res.json({
        status: true,
        message: "cart with given id not exists",
      });
    }
    let coupon = await Coupon.findOne({
      coupon_code: req.body.coupan_name,
    }).lean();

    var price = 0;
    if (coupon.min_amount > cart.cart[0].total_price) {
      return res.json({
        message:
          "Cannot apply this coupon min amount should be" + coupon.min_amount,
      });
    }

    if (coupon.apply == "percent") {
      price = eval(
        cart.cart[0].total_price -
          (cart.cart[0].total_price * coupon.amount) / 100
      );
    } else if (coupon.apply == "fixed") {
      price = cart.cart[0].total_price - coupon.amount;
    }
    // delete cart.cart[0].total_price;
    // cart.cart[0].total_price = price;

    const newupdate = await Cart.updateOne(
      { _id: req.body._cart },
      {
        _coupon: {
          coupon_id: coupon._id,
          discounted_price: price,
        },
      }
      // { new: true }
    ).lean();
    /* let cartLatest = await Cart.findOne({ _id: req.body._cart })
    .populate({
      path: "cart",
      populate: {
        path: "_product",
        model: Product,
        select: "name image unit",
      },
    }).lean();*/

    var cartLatest = await Cart.findOne({ _id: req.body._cart })
      .populate({
        path: "cart._product",
        select: "name sku price image _unit weight",
        populate: {
          path: "_unit",
          select: "name",
        },
      })
      .lean();

    if (!cartLatest)
      return res.json({ status: 0, message: "cart is empty", data: "" });
    let total_quantity, total_price, discounted_price;

    total_quantity = cartLatest.cart
      .map((product) => product.quantity)
      .reduce(function (acc, cur) {
        return acc + cur;
      });

    total_price = cartLatest.cart
      .map((product) => product.total_price)
      .reduce(function (acc, cur) {
        return acc + cur;
      });

    var product_list = [];
    await Promise.all(
      (products = cartLatest.cart.map(async (list) => {
        console.log("---product", list);
        var data = {};
        if (!list._product) return;
        let product_price = await _global.productprice(
          cartLatest._store,
          list._product._id
        );
        let image_path = list._product.image
          ? list._product.image
          : "not-available-image.jpg";
        let image = `${process.env.IMAGES_BUCKET_PATH}/products/${image_path}`;
        let total_price = list.total_price;
        let quantity = list.quantity;
        let unit = list._product._unit.name;
        delete list._product._unit;
        delete list.total_price;
        delete list.quantity;
        delete list.price;
        data = {
          ...list,
          _product: {
            ...list._product,
            in_cart: quantity,
            total_price: total_price.toFixed(2),
            image: image,
            unit: unit,
            regular_price: product_price.regular_price,
            deal_price: product_price.deal_price,
          },
        };
        product_list.push(data);
      }))
    );
    cartLatest.cart = product_list;

    let discout_amount = cartLatest?._coupon[0]?.discounted_price ?? 0;

    return res.json({
      message: "Listing of coupouns",
      data: cartLatest,
      subtotal: {
        in_cart: total_quantity,
        price: total_price.toFixed(2),
        shipping_cost: "100.00",
        discounted_amount: discout_amount,
        sub_total: (total_price - discout_amount).toFixed(2),
      },
    });
  } catch (err) {
    console.log("--logs", err);
    return res.status(400).json({ data: err.message });
  }
};

exports.removecoupon = async (req, res) => {
  try {
    let coupan_id = req.body.coupan_id;

    //let abc = await Cart.children.id(req.body._cart).remove();

    /* let cart = await Cart.findByIdAndUpdate(
      { _id: req.body._cart },
      { $pull: { _coupon._id: req.body.coupon_id } }
    );*/

    console.log(typeof req.body.coupon_id);

    let cart = await Cart.findByIdAndUpdate(
      { _id: req.body._cart },
      { $pull: { _coupon: { coupon_id: req.body.coupon_id } } },
      {
        new: true,
      }
    );

    return res.json({ message: "Remove coupoun", data: cart });
  } catch (err) {
    console.log("--logs", err);
    return res.status(400).json({ data: err.message });
  }
};
