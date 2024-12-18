const Wishlist = require("../../models/wishlist");
var moment = require("moment");
const { validationResult } = require("express-validator");
const _global = require("../../helper/common");
const { json } = require("body-parser");
const product = require("../../models/product");
const StoreProductPricing = require("../../models/store_product_pricing");

exports.addPoductToWishlist = async (req, res) => {
  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const wishlistInfo = {
      _user: req.session.userid,
      _product: req.body._product,
      _store: req.body._store,
      wish_price: req.body.wish_price,
      // max_price: req.body.max_price,
    };

    //get deal price
    var productPrice = await _global.productprice(
      req.body._store,
      req.body._product
    );
    var storeProductPrice = await StoreProductPricing.findOne({
      where: { _store: req.body._store, _product: req.body._product },
    });

    if (!productPrice)
      return res.json({
        status: 0,
        message: "_Store and _Product are invalid",
      });
    else if (
      req.body.wish_price > productPrice.regular_price ||
      req.body.wish_price > storeProductPrice.deal_price
    ) {
      return res.json({
        status: 2,
        message: "Price should not be greater than regular price",
      });
    } else {
      const wishlist = await Wishlist.create(wishlistInfo);
      return res.json({
        status: 1,
        message: "Product added to wishlist successfully",
        data: wishlist,
      });
    }
  } catch (err) {
    if (err.code == 11000) {
      await Wishlist.deleteOne({
        _user: res.locals.userid,
        _product: req.body._product,
        _store: req.body._store,
      });
      return res
        .status(200)
        .json({ status: 1, data: "Product removed from wishlist" });
    }
    return res.status(400).json({ data: err.message });
  }
};

(exports.updateProductWishPrice = async (req, res) => {
  try {
    _wishlist = req.params.wishlistid;
    wish_price = req.body.wish_price;
    // max_price = req.body.max_price;
    valid_till = req.body.valid_till;

    const wishlistProduct = await Wishlist.updateOne(
      { _id: _wishlist },
      { wish_price: wish_price, valid_till: valid_till }
    );
    return res.json({
      status: 1,
      message: "Wishlist Product Updated",
      data: wishlistProduct,
    });
  } catch (err) {
    return res.status(400).json({ data: err.message });
  }
}),
  (exports.deleteProductWishlist = async (req, res) => {
    try {
      Wishlist.deleteOne({ _id: req.params.listid }, function (err, data) {
        if (err) return res.json({ err: err.message });
        if (!data.deletedCount) {
          return res.json({ status: 1, message: "No product found", data: "" });
        }
        return res.json({
          status: 1,
          message: "Product Removed from Wishlist",
          data: data,
        });
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({ status: 0, message: "", data: err });
    }
  });

exports.allWishlistProducts = async (req, res) => {
  try {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let wishlist = await Wishlist.find({
      _user: res.locals.userid,
      _store: req.body._store,
    })
      .populate("_product", "name image")
      .lean();
    if (!wishlist.length)
      return res.json({ status: 1, message: "no data found", data: [] });
    wishlist = await Promise.all(
      wishlist
        .map(async (list) => {
          if (!list._product) return;
          var productId = list._product._id.toString();
          let image_path = list._product.image
            ? list._product.image
            : "not-available-image.jpg";
          let image = `${process.env.IMAGES_BUCKET_PATH}/products/${image_path}`;
console.log('---wishlist--',list)
          var wishList = await _global.wishList(
            res.locals.userid,
            req.body._store
          );
          var shoppingList = await _global.shoppingList(
            res.locals.userid,
            req.body._store
          );
          var cartProducts = await _global.cartProducts(
            res.locals.userid,
            req.body._store
          );

          var in_wishlist = wishList.includes(productId) ? 1 : 0;
          var in_shoppinglist = shoppingList.includes(productId) ? 1 : 0;
          var in_cart = productId in cartProducts ? cartProducts[productId] : 0;
          var wish_price = list.wish_price;
          // var max_price = list.max_price;
        //  delete list.wish_price;
          // delete list.max_price;
          delete list.createdAt;
          delete list.updatedAt;
          return {
            ...list,
            _product: {
              ...list._product,
              image: image,
              wish_price:wish_price,
              is_favourite: in_wishlist,
              in_shoppinglist: in_shoppinglist,
              in_cart: in_cart,
              wish_price: wish_price,
            },
          };
        })
        .filter(Boolean)
    );
    return res.json({ status: 1, message: "", data: wishlist });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ status: 0, message: "", data: err });
  }
};
//
exports.getListingWish = async (req, res) => {
  let wishlist = await Wishlist.findOne({
    _product: req.params.product_id,
  });
  return res.json({ status: 1, message: "", data: wishlist._id });
};
