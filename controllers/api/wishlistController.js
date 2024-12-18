const Wishlist = require("../../models/wishlist");
var moment = require("moment");
const { validationResult } = require("express-validator");
const _global = require("../../helper/common");
const { json } = require("body-parser");
const product = require("../../models/product");
const StoreProductPricing = require("../../models/store_product_pricing");
const ProductRegularPricing = require("../../models/product_regular_pricing");

exports.addPoductToWishlist = async (req, res) => {
  const errors = await validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const wishlistInfo = {
      _user: req.decoded.id,
      _product: req.body._product,
      _store: req.body._store,
      wish_price: req.body.wish_price,
    };
    //get deal price
    var productPrice = await _global.productprice(
      req.body._store,
      req.body._product
    );
    var storeProductPrice = await StoreProductPricing.findOne({
      where: { _store: req.body._store, _product: req.body._product },
    });
    if (!productPrice) {
      return res.json({
        status: 0,
        message: "_Store and _Product are invalid",
      });
    } else if (
      req.body.wish_price > productPrice.regular_price ||
      req.body.wish_price > storeProductPrice.deal_price
    ) {
      return res.json({
        status: 0,
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
    /*if (productPrice.effective_price <= req.body.wish_price) {
			return res.json({ status: 0, message: "Wish price should be less than  product price" })
		}*/
  } catch (err) {
    console.log("--value", err);
    if (err.code == 11000)
      return res
        .status(400)
        .json({ data: "Product with this name already exist" });
    return res.status(400).json({ data: err.message });
  }
};

(exports.updateProductWishPrice = async (req, res) => {
  try {
    _wishlist = req.body.wishlistid;
    wish_price = req.body.wish_price;

    const wishlistProduct = await Wishlist.updateOne(
      { _id: _wishlist },
      { wish_price: wish_price}
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
      const queryInfo = {
        _store: req.body._store,
        _product: req.body._product,
        _user: req.decoded.id,
      };
      Wishlist.deleteOne(queryInfo, function (err, data) {
        if (err) return res.json({ err: err });
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
      _user: req.decoded.id,
      _store: req.body._store,
    })
      .populate({
        path: "_product",
        select: "name image price weight",
        populate: {
          path: "_unit",
          select: "name",
        },
      })
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

          var productPrice = await _global.productprice(
            req.body._store,
            productId
          );
          if (!productPrice)
            return res.json({
              status: 0,
              message: "_Store and _Product are invalid",
            });

          var wishList = await _global.wishList(
            req.decoded.id,
            req.body._store
          );
          var shoppingList = await _global.shoppingList(
            req.decoded.id,
            req.body._store
          );
          var cartProducts = await _global.cartProducts(
            req.decoded.id,
            req.body._store
          );

          var in_wishlist = wishList.includes(productId) ? 1 : 0;
          var in_shoppinglist = shoppingList.includes(productId) ? 1 : 0;
          var quantity =
            productId in cartProducts ? cartProducts[productId] : 0;

          var unit = list._product._unit.name;
          var wish_price = list.wish_price;
          delete list.wish_price;
          delete list._product._unit;
          delete list._product.price;
          delete list.__v;
          delete list.createdAt;
          delete list.updatedAt;
          return {
            ...list,
            _product: {
              ...list._product,
              image: image,
              is_favourite: in_wishlist,
              in_shoppinglist: in_shoppinglist,
              in_cart: quantity,
              unit: unit,
              deal_price: productPrice.effective_price,
              regular_price: productPrice.regular_price,
              wish_price:wish_price
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
