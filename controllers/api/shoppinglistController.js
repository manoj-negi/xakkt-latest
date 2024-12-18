const Shoppinglist = require("../../models/shoppinglist");
const ShoppinglistName = require("../../models/shoppinglist_name");
var ObjectId = require("mongoose").Types.ObjectId;
var moment = require("moment");
const { validationResult } = require("express-validator");
const _global = require("../../helper/common");

(exports.allShoppingLists = async (req, res) => {
  try {
    const listInfo = {
      _user: req.decoded.id,
      _store: req.body._store,
    };
    let shoppinglist = await ShoppinglistName.find(listInfo, "name").exec();
    if (!shoppinglist.length)
      return res.json({
        status: "false",
        message: "No data found",
        data: shoppinglist,
      });
    return res.json({ status: 1, message: "", data: shoppinglist });
  } catch (err) {
    res.status(400).json({ status: 1, message: "", data: err });
  }
}),
  (exports.addProductToshoppinglist = async (req, res) => {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      shoppinglistInfo = {
        _shoppinglist: req.body._shoppinglist,
        _product: req.body._product,
        quantity: req.body.quantity,
      };
      const product = await Shoppinglist.create(shoppinglistInfo);

      return res.json({
        status: 1,
        message: "Product added to shoppinglist successfully",
        data: product,
      });
    } catch (err) {
      res.status(400).json({ data: err.message });
    }
  });

(exports.createShoppingList = async function (req, res) {
  try {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 0, errors: errors.array() });
    }
    console.log(req.decoded);
    const ShoppinglistInfo = {
      name: req.body.name,
      _user: req.decoded.id,
      _store: req.body._store,
    };

    const shoppinglist = await ShoppinglistName.create(ShoppinglistInfo);
    return res.json({
      status: 1,
      message: "Shopping List Created",
      data: shoppinglist,
    });
  } catch (err) {
    console.log(err);
    if (err.code == 11000)
      return res
        .status(400)
        .json({ status: 0, data: "List with this name already exist" });
    res.status(400).json({ status: 0, data: err.message });
  }
}),
  (exports.updateShoppinglist = async function (req, res) {
    try {
      const updatedList = await Shoppinglist.findByIdAndUpdate(
        req.body._shoppinglistid,
        { $set: { quantity: req.body.quantity } },
        { new: true }
      ).exec();
      return res.json({
        status: 1,
        message: "Shopping List Updated",
        data: updatedList,
      });
    } catch (err) {
      return res.status(400).json({ status: 0, message: "", data: err });
    }
  });

exports.deleteProductFromShoppinglist = async (req, res) => {
  try {
    Shoppinglist.deleteOne({ _id: req.params.shoppinglistid }, function (err) {
      if (err) return res.json({ status: 1, message: "", data: err });
      return res.json({ status: 1, message: "Product removed", data: [] });
    });
  } catch (err) {
    return res.status(400).json({ status: 0, message: "", data: err });
  }
};

exports.deleteShoppinglist = async (req, res) => {
  try {
    const delList = await ShoppinglistName.deleteOne({
      _id: req.params.id,
    }).then();
    if (!delList.deletedCount) {
      return res.json({ status: 1, message: "No category found", data: "" });
    }
    const delProducts = await Shoppinglist.deleteMany({
      _shoppinglist: req.params.id,
    }).exec();
    res.json({ status: 1, message: "List deleted", data: delProducts });
  } catch (err) {
    return res.status(400).json({ status: 0, message: "", data: err });
  }
};

exports.shoppinglistProducts = async (req, res) => {
  try {
    let shoppinglist = await Shoppinglist.find({
      _shoppinglist: req.params.shoplist,
    })
      .populate({
        path: "_product",
        select: "name sku image weight",
        populate: {
          path: "_unit",
          select: "name",
        },
      })
      .populate("_shoppinglist", "name _store")
      .lean();

    if (!shoppinglist.length)
      return res.json({
        status: 0,
        message: "No data found",
        data: shoppinglist,
      });

    shoppinglist = await Promise.all(
      shoppinglist
        .map(async (list) => {
          var productPrice = await _global.productprice(
            list._shoppinglist._store,
            list._product._id
          );

          if (!list._product) return;
          var productId = list._product._id.toString();
          let image_path = list._product.image
            ? list._product.image
            : "not-available-image.jpg";
          let image = `${process.env.IMAGES_BUCKET_PATH}/products/${image_path}`;
          let unit = list._product._unit.name;
          let deal_price = productPrice.deal_price;
          let regular_price = productPrice.regular_price;

          var wishList = await _global.wishList(
            req.decoded.id,
            list._shoppinglist._store
          );
          var shoppingList = await _global.shoppingList(
            req.decoded.id,
            list._shoppinglist._store
          );
          var cartProducts = await _global.cartProducts(
            req.decoded.id,
            list._shoppinglist._store
          );

          var in_wishlist = wishList.includes(productId) ? 1 : 0;
          var in_shoppinglist = shoppingList.includes(productId) ? 1 : 0;
          var quantity =
            productId in cartProducts ? cartProducts[productId] : 0;

          var list_quantity = list.quantity;
          delete list.quantity;
          delete list._product._unit;
          return {
            ...list,
            _product: {
              ...list._product,
              unit: unit,
              image: image,
              is_favourite: in_wishlist,
              in_shoppinglist: in_shoppinglist,
              deal_price: deal_price,
              regular_price: regular_price,
              in_cart: list_quantity,
              quantity: list_quantity,
            },
          };
        })
        .filter(Boolean)
    );

    return res.json({ status: 1, message: "", data: shoppinglist });
  } catch (err) {
    console.log(err);
    res.status(400).json({ status: 0, message: err });
  }
};
