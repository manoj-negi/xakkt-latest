const Product = require("../../models/product");
const { validationResult } = require("express-validator");
const _global = require("../../helper/common");
const Cart = require("../../models/cart");
const cardDetails = require("../../models/carddetail");
const User = require("../../models/user");
var ObjectId = require("mongoose").Types.ObjectId;
const Store = require("../../models/store");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const orderController = require("./orderController");

exports.cartProducts = async (req, res) => {
  try {
    let condition = { _store: req.body.storeid };
    condition = req.session.userid
      ? { ...condition, _user: req.session.userid }
      : { ...condition, sessionId: req.sessionID };

    var cartProducts = await Cart.findOne(condition)
      .populate({
        path: "cart",
        populate: {
          path: "_product",
          model: Product,
          select: "name image unit",
        },
      })
      .lean();

    if (cartProducts?.cart.length)
      return res.json({ status: 1, data: cartProducts.cart });
    return res.json({ status: 0, data: [] });
  } catch (err) {
    console.log("--err", err);
    return res.status(400).json({ data: "Something Went Wrong" });
  }
};

exports.addPoductToCart = async (req, res) => {
  try {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    var productInfo = await Product.findById(req.body._product);
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

    var data = {
      _product: req.body._product,
      quantity: req.body.quantity,
      total_price: productprice.effective_price * req.body.quantity,
    };

    let condition = { _store: req.body._store };
    condition = req.session.userid
      ? { ...condition, _user: req.session.userid }
      : { ...condition, sessionId: req.sessionID };

    let getProdCond = {
      ...condition,
      cart: { $elemMatch: { _product: req.body._product } },
    };

    var total_quantity;
    var product = await Cart.findOne(getProdCond);

    if (product?.cart) {
      await Cart.findOneAndUpdate(condition, {
        $pull: { cart: { _product: req.body._product } },
      });
      var data = await Cart.findOne({
        _user: req.session.userid,
        _store: req.body._store,
      }).lean();
      total_quantity = data.cart
        .map((product) => product.quantity)
        .reduce(function (acc, cur) {
          return acc + cur;
        });
      var message = "Product removed from cart";
    } else {
      await Cart.findOneAndUpdate(
        condition,
        { $push: { cart: data } },
        { upsert: true }
      ).lean();
      var data = await Cart.findOne({
        _user: req.session.userid,
        _store: req.body._store,
      }).lean();
      total_quantity = data.cart
        .map((product) => product.quantity)
        .reduce(function (acc, cur) {
          return acc + cur;
        });
      var message = "Product added to the cart";
    }

    return res.json({
      status: 1,
      message: message,
      data: { iscart: 1, total_products: total_quantity },
    });
  } catch (err) {
    console.log("--errr", err);
    return res.status(400).json({ data: "Something Went Wrong" });
  }
};

exports.checkoutPage = async (req, res) => {
  try {
    let storedata = await Store.findOne({ slug: req.params.store })
      .select(
        "-time_schedule -_department -holidays -__v -createdAt -updatedAt -_user"
      )
      .populate({
        path: "_currency",
        select: "name",
      })
      .lean();

    var user = await User.findOne({ _id: req.session.userid }).lean();
    //if(!addresses.address){ return res.json({ status: 0, message: "No default address added for you" }) }
    //return res.json({data:addresses})

    let condition = { _store: storedata._id };
    condition = req.session.userid
      ? { ...condition, _user: req.session.userid }
      : { ...condition, sessionId: req.sessionID };

    var cartProducts = await Cart.findOne(condition)
      .populate({
        path: "cart",
        populate: {
          path: "_product",
          model: Product,
          select: "name image unit",
        },
      })
      .lean();

    const paymentMethods = await stripe.customers.listPaymentMethods(
      `${req.session.customerId}`,
      { type: "card" }
    );

    // const cards = await stripe.customers.listSources(
    //   `${req.session.customerId}`,
    //   {
    //     source: "tok_amex",
    //   }
    // );
    console.log("sdscard", paymentMethods.data);
    //return res.json({card:paymentMethods.data})
    //return res.json(user?.address)
    //if(cartProducts?.cart.length)return res.json({status:1,data:cartProducts.cart, store: storedata})
    return res.render("frontend/checkout", {
      status: 1,
      data: cartProducts,
      addresses: user?.address ?? null,
      store: storedata,
      cards: paymentMethods.data,
      // cardsNew: cards.data,
      customerID: req.session.customerId,
    });
  } catch (err) {
    console.log("--err", err);
    return res.status(400).json({ data: "Something Went Wrong" });
  }
};

(exports.cartSize = async (req, res) => {
  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 0, errors: errors.array() });
  }

  try {
    const cartInfo = {
      _user: req.body._user,
      _store: req.body._store,
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
}),
  (exports.removeProductFromCart = async (req, res) => {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const cartInfo = {
        _store: req.body._store,
        _product: req.body._product,
        _user: req.session.userid,
      };

      var product = await Cart.findOneAndUpdate(
        { _user: cartInfo._user, _store: cartInfo._store },
        { $pull: { cart: { _product: cartInfo._product } } },
        { new: true }
      );

      if (product?.cart) {
        product.cart.pull({ _product: cartInfo._product });
        await product.save();
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
      console.log(err);
      return res.status(400).json({ data: err.message });
    }
  });

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
      _user: req.session.userid,
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
      _user: req.session.userid,
      _store: req.params.storeid,
    }).exec();
    if (!remove) return res.json({ status: false });
    return res.json({ status: true, message: "Cart is empty now" });
  } catch (err) {
    res.send(err);
  }
};

exports.getProductsQuantity = async (req, res) => {
  try {
    console.log("=====", req.body);
    let storedata = await Store.findOne({ slug: req.params.store })
      .select(
        "-time_schedule -_department -holidays -__v -createdAt -updatedAt -_user"
      )
      .populate({
        path: "_currency",
        select: "name",
      })
      .lean();

    var user = await User.findOne({ _id: req.session.userid }).lean();
    // if(!addresses.address){ return res.json({ status: 0, message: "No default address added for you" }) }
    // return res.json({data:addresses})

    let condition = { _store: storedata._id };
    condition = req.session.userid
      ? { ...condition, _user: req.session.userid }
      : { ...condition, sessionId: req.sessionID };

    var cartProducts = await Cart.findOne(condition)
      .populate({
        path: "cart",
        populate: {
          path: "_product",
          model: Product,
          select: "name image unit",
        },
      })
      .lean();

    const array = [];
    cartProducts.cart.map((e) => {
      array.push(e.quantity);
    });
    // console.log("======data",array)
    // return res.json({status :1,data:array})
    //if(cartProducts?.cart.length)return res.json({status:1,data:cartProducts.cart, store: storedata})
    return res.render("_partials/_frontend/navbar.ejs", { data: "abc" });
  } catch (err) {
    return res.status(400).json({ data: "Something Went Wrong" });
  }
};

(exports.orderCheckout = async (req, res) => {
  try {
    var total = 0;
    const cartInfo = {
      _user: req.body.items[0].user_id,
      _store: req.body.items[0].store_id,
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

    for (const [i, product] of data.cart.entries()) {
      total += product.total_price;
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total * 100,
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.log("--err", err);
    return res.status(400).json({ data: "Something Went Wrong" });
  }
}),
  (exports.saveCard = async (req, res) => {
    try {
      console.log("-----req.session.customerId}---", req.body);
      req.body._user = req.session.userid;
      console.log("session", req.session.customerId);
      const paymentMethod = await stripe.paymentMethods.attach(
        `${req.body.payment_id}`,
        {
          customer: `${req.session.customerId}`,
        }
      );
      //create card source
      // await stripe.customers.createSource(`${req.session.customerId}`, {
      //   source: "tok_amex",
      // });
      console.log("--paymentMethod-", paymentMethod);
      const addCard = await cardDetails.create(req.body);

      console.log("--addCArd-", addCard);
      return res
        .status(200)
        .json({ status: true, data: "Card Added Successfully" });
    } catch (err) {
      console.log("--err", err);
      return res.status(400).json({ data: "Something Went Wrong" });
    }
  });

exports.listCards = async (req, res) => {
  try {
    const paymentMethods = await stripe.customers.listPaymentMethods(
      `${req.session.customerId}`,
      { type: "card" }
    );
    console.log(paymentMethods);
    return res.status(200).json({ data: paymentMethods });
  } catch (err) {
    console.log("--err", err);
    return res.status(400).json({ data: "Something Went Wrong" });
  }
};

exports.chargeSavedCard = async (req, res) => {
  try {
    console.log("----req body,", req.body);
    var total = 0;

    const cartInfo = {
      _user: req.body.userid,
      _store: req.body.storeid,
      cvv: req.body.cvvHidden,
      // cvv: req.body.cvv.filter(Boolean),
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

    for (const [i, product] of data.cart.entries()) {
      total += product.total_price;
    }
    console.log("----", total);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total * 100,
      currency: "usd",
      // payment_method_types: ["card"],
      customer: `${req.decoded.customer_id}`,
      payment_method: req.body.payment_method_id,
      confirmation_method: "manual",
      confirm: true,
    });
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: total * 100,
    //   currency: "usd",
    //   // payment_method_types: ["card"],
    //   customer: `${req.session.customerId}`,
    //   automatic_payment_methods: {
    //     enabled: true,
    //   },
    // });

    // const charge = await stripe.charges.create({
    //   amount: total * 100,
    //   currency: "usd",
    //   customer: `${req.session.customerId}`,
    // });

    console.log("charge----", charge);
    req.charge = paymentIntent;
    const result = await orderController.placeOrder(req, res);

    return result;
    // return res.json({ data: paymentIntent });
  } catch (err) {
    //  console.log("--err", err.raw.message);
    return res.render("frontend/payment-error", {
      status: 1,
      // message: err.raw.message,
    });
    // res.redirect("/payment-error", mess);
    // return res.status(400).json({ data: "Something Went Wrong" });
  }
};

exports.connectionToken = async (req, res) => {
  const token = await stripe.terminal.connectionTokens.create();
  res.json({ secret: token.secret });
};

exports.deleteCard = async (req, res) => {
  try {
    const result = await stripe.paymentMethods.detach(req.body.items.cardId);
    // console.log(result);
    return true;
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
/*app.post("/create-payment-intent", async (req, res) => {
	const { items } = req.body;
  
	// Create a PaymentIntent with the order amount and currency
	const paymentIntent = await stripe.paymentIntents.create({
	  amount: 200,
	  currency: "usd",
	  automatic_payment_methods: {
		enabled: true,
	  },
	});
  
	res.send({
	  clientSecret: paymentIntent.client_secret,
	}); 
  });*/
