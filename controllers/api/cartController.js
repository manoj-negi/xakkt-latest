const Cart = require("../../models/cart");
const Product = require("../../models/product");
const { validationResult } = require("express-validator");
const _global = require("../../helper/common");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const cardDetails = require("../../models/carddetail");
const orderController = require("./orderController");
const pushController = require("./pushController");

exports.listCards = async (req, res) => {
  const errors = await validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 0, errors: errors.array() });
  }
  try {
    const paymentMethods = await stripe.customers.listPaymentMethods(
      `${req.decoded.customer_id}`,
      { type: "card" }
    );
    console.log(paymentMethods);
    return res.status(200).json({ data: paymentMethods });
  } catch (err) {
    console.log("--err", err);
    return res.status(400).json({ data: "Something Went Wrong" });
  }
};
exports.saveCard = async (req, res) => {
  try {
    // req.body._user = req.decoded.id;
    const user_id = req.decoded.id;
    const cardNUmber = req.body.card_number;
    const cvc = req.body.cvc;
    const mm = req.body.month;
    const yy = req.body.year;
    const email = req.body.email;
    const cardElement = {
      number: cardNUmber,
      cvc: cvc,
      exp_month: mm,
      exp_year: yy,
    };
    console.log(cardElement);
    const payment = await stripe.paymentMethods.create({
      type: "card",
      card: cardElement,
      billing_details: {
        name: email,
      },
    });

    console.log(payment.id);
    console.log("session", req.decoded.customer_id);
    const paymentMethod = await stripe.paymentMethods.attach(payment.id, {
      customer: `${req.decoded.customer_id}`,
    });
    //create card source
    // await stripe.customers.createSource(`${req.decoded.customer_id}`, {
    //   source: "tok_amex",
    // });
    console.log("--paymentMethod-", paymentMethod);
    const saveCardData = {
      _user: req.decoded.id,
      payment_id: payment.id,
    };
    const addCard = await cardDetails.create(saveCardData);

    console.log("--addCArd-", addCard);
    return res
      .status(200)
      .json({ status: true, data: "Card Added Successfully" });
  } catch (err) {
    console.log("--err", err);
    return res.status(400).json({ data: "Something Went Wrong" });
  }
};
exports.deleteCard = async (req, res) => {
  const errors = await validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 0, errors: errors.array() });
  }
  try {
    const paymentId = req.body.paymentId;
    const result = await stripe.paymentMethods.detach(paymentId);
    return res
      .status(200)
      .json({ status: true, data: "Card Deleted Successfully" });
    // return res.status(200).json({ data: result });
    // const deleted = await stripe.customers.deleteSource(
    //   "cus_AJ6yEs79rUDTXH",
    //   "card_1KcKr32eZvKYlo2Crb8iDRlE"
    // );
  } catch (err) {
    console.log("--err", err);
    return res.status(400).json({ data: "Something Went Wrong" });
  }
};
exports.listCartProduct = async (req, res) => {
  var product_list = [];
  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 0, errors: errors.array() });
  }

  try {
    const cartInfo = {
      _user: req.decoded.id,
      _store: req.params.store,
    };

    var data = await Cart.findOne({
      _user: cartInfo._user,
      _store: cartInfo._store,
    })
      .populate({
        path: "cart._product",
        select: "name sku price image _unit weight",
        populate: {
          path: "_unit",
          select: "name",
        },
      })
      .lean();
    if (!data)
      return res.json({ status: 0, message: "cart is empty", data: "" });
    let total_quantity, total_price, coupon, discounted_price;
    total_quantity = data.cart
      .map((product) => product.quantity)
      .reduce(function (acc, cur) {
        return acc + cur;
      });

    total_price = data.cart
      .map((product) => product.total_price)
      .reduce(function (acc, cur) {
        return acc + cur;
      });

    await Promise.all(
      (products = data.cart.map(async (list) => {
        console.log("---product", list);
        var data = {};
        if (!list._product) return;
        let product_price = await _global.productprice(
          req.params.store,
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
    data.cart = product_list;
    let discout_amount = data?._coupon[0]?.discounted_price ?? 0;

    return res.json({
      status: 1,
      message: "All cart products",
      data: data,
      subtotal: {
        in_cart: total_quantity,
        price: total_price.toFixed(2),
        shipping_cost: "100.00",
        discounted_amount: discout_amount,
        sub_total: (total_price - discout_amount).toFixed(2),
      },
    });
  } catch (err) {
    return res.status(400).json({ status: 0, data: err.message });
  }
};
exports.cartSize = async (req, res) => {
  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 0, errors: errors.array() });
  }

  try {
    const cartInfo = {
      _user: req.decoded.id,
      _store: req.params.storeid,
    };

    var data = await Cart.findOne({
      _user: cartInfo._user,
      _store: cartInfo._store,
    }).lean();

    if (!data)
      return res.json({ status: 0, message: "cart is empty", data: "" });
    let total_quantity;
    total_quantity = data.cart
      .map((product) => product.quantity)
      .reduce(function (acc, cur) {
        return acc + cur;
      });

    return res.json({
      status: 1,
      message: "total products in the cart",
      data: { total_products: total_quantity },
    });
  } catch (err) {
    return res.status(400).json({ status: 0, data: err.message });
  }
};
exports.addPoductToCart = async (req, res) => {
  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // const push = await pushController.firebase(req, res);
    // console.log("push", push);
    // return;
    var productInfo = await Product.findById(req.body._product);
    console.log(productInfo);
    let productprice = await _global.productprice(
      req.body._store,
      req.body._product
    );

    if (!productprice)
      return res.json({
        status: 0,
        message: "Product Price of this id not set yet",
      });
    if (!productInfo)
      return res.json({
        status: 0,
        message: "Product with this id not exists",
      });
    const cartInfo = {
      _user: req.decoded.id,
      _store: req.body._store,
      cart: {
        _product: req.body._product,
        quantity: req.body.quantity,
        total_price: productprice.effective_price * req.body.quantity,
      },
    };

    var product = await Cart.findOne({
      _user: cartInfo._user,
      _store: cartInfo._store,
      cart: { $elemMatch: { _product: cartInfo.cart._product } },
    });
    if (product?.cart) {
      return res.json({
        status: 0,
        message: "Product is already in the cart",
      });
    } else {
      product = await Cart.findOne({
        _user: cartInfo._user,
        _store: cartInfo._store,
      });
      if (!product) {
        product = await Cart.create(cartInfo);
        console.log(product);
      } else {
        product.cart.push(cartInfo.cart);
        await product.save();
      }
    }
    var prod = product.toObject();
    var total_products = 0;
    product = prod.cart.map((data) => {
      total_products += data.quantity;
      return data;
    });

    return res.json({
      status: 1,
      message: "Product added to cart successfully",
      total_products: total_products,
    });
  } catch (err) {
    console.log("--errr", err);
    return res.status(400).json({ data: err.message });
  }
};

exports.removeProductFromCart = async (req, res) => {
  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const cartInfo = {
      _store: req.body._store,
      _product: req.body._product,
      _user: req.decoded.id,
    };

    var product = await Cart.findOneAndUpdate(
      { _user: cartInfo._user, _store: cartInfo._store },
      { $pull: { cart: { _product: cartInfo._product } } },
      { new: true }
    );
    if (product?.cart) {
      product.cart.pull({ _product: cartInfo._product });
      await product.save();
      // product.cart.id().remove();
      console.log(product);
    }
    var data = await Cart.findOne({
      _user: cartInfo._user,
      _store: cartInfo._store,
    })
      .populate("cart._product", "name sku price image")
      .lean();
    if (!data)
      return res.json({ success: 0, message: "cart is empty", data: "" });

    let total_quantity, total_price, coupon, discounted_price;

    total_quantity = data.cart
      .map((product) => product.quantity)
      .reduce(function (acc, cur) {
        return acc + cur;
      });

    total_price = data.cart
      .map((product) => product.total_price)
      .reduce(function (acc, cur) {
        return acc + cur;
      });

    products = data.cart.map((list) => {
      if (!list._product) return;
      let image_path = list._product.image
        ? list._product.image
        : "not-available-image.jpg";
      let image = `${process.env.IMAGES_BUCKET_PATH}/products/${image_path}`;
      let total_price = list.total_price;
      let quantity = list.quantity;
      delete list.total_price;
      delete list.quantity;
      return {
        ...list,
        _product: {
          ...list._product,
          in_cart: quantity,
          total_price: total_price.toFixed(2),
          image: image,
        },
      };
    });
    data.cart = products;
    discounted_price = 20;
    coupon = {
      code: "AZXPN102",
      discount: "20%",
    };
    return res.json({
      status: 1,
      message: "Product removed",
      data: data,
      subtotal: {
        quantity: total_quantity,
        price: total_price.toFixed(2),
        shipping_cost: "100.00",
        coupon: coupon,
        sub_total: total_price.toFixed(2),
      },
    });
  } catch (err) {
    return res.status(400).json({ data: err.message });
  }
};

exports.updateProductQuantity = async (req, res) => {
  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const cartInfo = {
      quantity: req.body.quantity,
      _store: req.body._store,
      _product: req.body._product,
      _user: req.decoded.id,
    };
    var productInfo = await Product.findById(req.body._product);
    let productprice = await _global.productprice(
      req.body._store,
      req.body._product
    );
    if (!productInfo)
      return res.json({ success: 0, message: "cart is empty", data: "" });
    //var cartProduct = await Cart.aggregate([{ $unwind: '$cart'},{$match:{_user:mongoose.Types.ObjectId(cartInfo._user),_store:mongoose.Types.ObjectId(cartInfo._store),"cart._product":mongoose.Types.ObjectId(cartInfo._product)} }])
    var pQuantity = cartInfo.quantity;
    var pPrice = productprice.effective_price * pQuantity;
    console.log("--vlaue", pPrice);
    // console.log(productInfo.price)
    var product = await Cart.findOneAndUpdate(
      {
        _user: cartInfo._user,
        _store: cartInfo._store,
        cart: { $elemMatch: { _product: cartInfo._product } },
      },
      {
        $set: {
          "cart.$.quantity": pQuantity,
          "cart.$.total_price": pPrice,
        },
      },
      { new: true, upsert: true }
    ).lean();
    //  var product = await Cart.findOneAndUpdate({_user:cartInfo._user,_store:cartInfo._store,cart:{$elemMatch: {_product:cartInfo._product}}},{$set:{cart: {'cart.$.quantity': cartInfo.quantity, 'cart.$.total_price':cartInfo.total_price }}},{new: true});
    if (product?.cart) {
      var data = await Cart.findOne({
        _user: cartInfo._user,
        _store: cartInfo._store,
      })
        .populate("cart._product", "name sku price image")
        .lean();
      if (!data)
        return res.json({ success: 0, message: "cart is empty", data: "" });

      let total_quantity, total_price, coupon, discounted_price;

      total_quantity = data.cart
        .map((product) => product.quantity)
        .reduce(function (acc, cur) {
          return acc + cur;
        });

      total_price = data.cart
        .map((product) => product.total_price)
        .reduce(function (acc, cur) {
          return acc + cur;
        });

      products = data.cart.map((list) => {
        if (!list._product) return;
        let image_path = list._product.image
          ? list._product.image
          : "not-available-image.jpg";
        let image = `${process.env.IMAGES_BUCKET_PATH}/products/${image_path}`;
        let total_price = list.total_price;
        let quantity = list.quantity;
        delete list.total_price;
        delete list.quantity;
        return {
          ...list,
          _product: {
            ...list._product,
            in_cart: quantity,
            total_price: total_price.toFixed(2),
            image: image,
          },
        };
      });
      data.cart = products;
      discounted_price = 20;
      coupon = {
        code: "AZXPN102",
        discount: "20%",
      };

      if (req.query.view_cart == 1) {
        var responseData = {
          status: 1,
          message: "Product Update",
          total_products: total_quantity,
          data: data,
          subtotal: {
            price: total_price.toFixed(2),
            shipping_cost: "100.00",
            sub_total: total_price.toFixed(2),
          },
        };
      } else {
        var responseData = {
          status: 1,
          message: "Product Update",
          total_products: total_quantity,
        };
      }
      return res.json(responseData);
    }
    return res.json({ status: 0, message: "No data found", data: {} });
  } catch (err) {
    console.log("--err", err);
    return res.status(400).json({ data: err.message });
  }
};

exports.makeCartEmpty = async (req, res) => {
  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let remove = await Cart.deleteOne({
      _user: req.decoded.id,
      _store: req.params.storeid,
    }).exec();
    if (!remove) return res.json({ status: false });
    return res.json({ status: true, message: "Cart is empty now" });
  } catch (err) {
    res.send(err);
  }
};

exports.orderCheckout = async (req, res) => {
  try {
    /*    const cartInfo = {
            _user: req.decoded.id,
            _store: req.params.store,
        }

        var data = await Cart.findOne({ _user: cartInfo._user, _store: cartInfo._store }).populate({
                                                                                                path:'cart._product', 
                                                                                                select:'name sku price image _unit weight',
                                                                                                populate:{
                                                                                                          path:'_unit',
                                                                                                          select: 'name' 
                                                                                                          }
                                                                                                }).lean();
        if (!data) return res.json({ status: 0, message: "cart is empty", data: "" });
        let total_quantity, total_price, coupon, discounted_price;
        total_quantity = data.cart.map(product => product.quantity).reduce(function (acc, cur) {
            return acc + cur;
        })

        total_price = data.cart.map(product => product.total_price).reduce(function (acc, cur) {
            return acc + cur;
        })
*/
    var total = 0;
    const cartInfo = {
      //   _user: req.body.items[0].user_id,
      _store: req.body.store_id,
      cart_id: req.body.cart_id,
    };
    console.log(cartInfo);
    var data = await Cart.findOne({
      _store: cartInfo._store,
      _id: cartInfo.cart_id,
    })
      .populate({
        path: "cart._product",
        select: "name sku price image _unit weight",
        populate: {
          path: "_unit",
          select: "name",
        },
      })
      .lean();
    console.log(data);
    if (!data)
      return res.json({ status: 0, message: "cart is empty", data: "" });
    let total_quantity, total_price, coupon, discounted_price;
    total_quantity = data.cart
      .map((product) => product.quantity)
      .reduce(function (acc, cur) {
        return acc + cur;
      });

    total_price = data.cart
      .map((product) => product.total_price)
      .reduce(function (acc, cur) {
        return acc + cur;
      });

    for (const [i, product] of data.cart.entries()) {
      total += product.total_price;
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total * 100,
      currency: "usd",
      //   payment_method_types: ["card"],
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // const { items } = JSON.parse(req.body);
    // console.log("---the items--", items);
    // Create a PaymentIntent with the order amount and currency
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: 200,
    //   currency: "usd",
    //   //   payment_method_types: ['card'],
    //   automatic_payment_methods: {
    //     enabled: true,
    //   },
    // });

    console.log(paymentIntent, "--paymentIntent-");
    res.send({
      paymentIntent: paymentIntent,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.log("--err", err);
    return res.status(400).json({ data: "Something Went Wrong" });
  }
};
exports.chargeSavedCard = async (req, res) => {
  try {
    console.log("----req body,", req.body);
    const total = req.body.total;
    const cartInfo = {
      _id: req.body.cartid,
      // cvv: req.body.cvv,
      // cvv: req.body.cvv.filter(Boolean),
    };

    var data = await Cart.findOne({
      _id: cartInfo._id,
    }).lean();
    // .populate({
    //   path: "cart._product",
    //   select: "name sku price image _unit weight",
    //   populate: {
    //     path: "_unit",
    //     select: "name",
    //   },
    // })

    if (!data)
      return res.json({ status: 0, message: "cart is empty", data: "" });
    // let total_quantity, total_price, coupon, discounted_price;
    // total_quantity = data.cart
    //   .map((product) => product.quantity)
    //   .reduce(function (acc, cur) {
    //     return acc + cur;
    //   });

    // total_price = data.cart
    //   .map((product) => product.total_price)
    //   .reduce(function (acc, cur) {
    //     return acc + cur;
    //   });

    // for (const [i, product] of data.cart.entries()) {
    //   total += product.total_price;
    // }
    // console.log("----", total);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: total * 100,
      currency: "usd",
      // payment_method_types: ["card"],
      customer: `${req.decoded.customer_id}`,
      payment_method: req.body.payment_method_id,
      confirmation_method: "manual",
      confirm: true,
    });
    // console.log("payment_intet", paymentIntent);
    // console.log("dfdf");
    // const charge = await stripe.charges.create({
    //   amount: total * 100,
    //   currency: "usd",
    //   customer: `${req.decoded.customer_id}`,
    //   // source: "pm_1KdpUMLkH4ZUmaJSVBN0Z7YM",
    //   metadata: { payment_intent: paymentIntent.id },
    // });

    req.charge = paymentIntent;
    req.total = total;
    const result = await orderController.placeOrder(req, res);
    console.log("result", result);
    if (result == true) {
      return res.status(200).json({ transaction_id: paymentIntent.id });
    } else {
      return res.status(400).json({ data: "something went wrong" });
    }
    // return res.json({ data: paymentIntent });
  } catch (err) {
    console.log("--err", err);
    return res.status(400).json({ data: "something went wrong" });
  }
};
