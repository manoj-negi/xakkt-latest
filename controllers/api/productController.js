const Product = require("../../models/product");
const ProductCategory = require("../../models/product_category");
const ProductRegularPricing = require("../../models/product_regular_pricing");
const StoreProductPricing = require("../../models/store_product_pricing");
const Store = require("../../models/store");

var moment = require("moment");
const { validationResult } = require("express-validator");
const fs = require("fs");
const _global = require("../../helper/common");

(exports.list = async (req, res) => {
  try {
    var storess = [];
    var productId = [];

    let stores = await StoreProductPricing.find({
      _store: req.params.storeid,
    })
      .select("-createdAt -updatedAt -__v")
      .populate("_product", "name image sku")
      .populate("_deal")
      .lean({ getters: true });

    if (stores.length) {
      stores.map((item) => {
        productId.push(item._product._id);
      });
    }
    let regular = await ProductRegularPricing.find({
      _store: req.params.storeid,
      _product: {
        $nin: productId,
      },
    })
      .populate("_product")
      .lean({ getters: true });
    if (stores.length > 0) {
      // return res.json({
      // 	status: 0,
      // 	message: "No data found",
      // 	data: []
      // });
      await Promise.all(
        stores.map(async (store) => {
          var data = {};
          // stores = stores.map(store => {
          //product.image = `${process.env.IMAGES_BUCKET_PATH}/images/products/${product.image}`;
          let prices = await _global.productprice(
            req.params.storeid,
            store._product
          );
          (_product = store._product), (_deal = store._deal);
          delete store._product;
          delete store._deal;
          data = {
            ...store,
            _product: _product._id,
            name: _product.name,
            regular_price: prices.regular_price,
            image: `${process.env.IMAGES_BUCKET_PATH}/products/${_product.image}`,
            sku: _product.sku,
            deal: _deal.name,
          };
          storess.push(data);
        })
      );
    }
    regular.filter((item) => {
      let regularData = {
        _product: item._product._id,
        _store: item._store,
        image: `${process.env.IMAGES_BUCKET_PATH}/products/${item._product.image}`,
        sku: item._product.sku,
        name: item._product.name,
        deal_price: 0,
        regular_price: item.regular_price,
      };
      storess.push(regularData);
    });
    //  storess.push(regular)
    return res.json({
      status: 1,
      baseUrl: process.env.BASE_URL,
      message: "",
      data: storess,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: 0,
      message: "",
      data: err,
    });
  }
}),
  (exports.show = async (req, res) => {
    try {
      var productPrice = await _global.productprice(
        req.body._store,
        req.body._product
      );
      const product = await Product.findById(req.body._product)
        .select(
          "-meta_title -meta_keywords -meta_description -updatedAt -createdAt -__v"
        )
        .lean({ getters: true });

      if (!product)
        return res.json({
          status: 1,
          message: "Product not found",
          data: [],
        });
      product.price = productPrice.regular_price;
      product.deal_price = productPrice.deal_price;
      return res.json({
        status: 1,
        message: "",
        data: product,
      });
    } catch (err) {
      res.status(400).json({
        status: 0,
        data: err,
      });
    }
  });
exports.search = async (req, res) => {
  try {
    var search_product = [];
    // var pagno = req.query.start / req.query.length + 1
    var page = req.body.page || 1; //for next page pass 1 here
    var limit = req.body.limit || 10;
    let searchString = req.body.search || "";
    let product = await ProductRegularPricing.find({
      _store: req.body._store,
    })
      .populate({
        path: "_product",
        match: {
          $or: [
            {
              description: {
                $regex: ".*" + searchString + ".*",
                $options: "i",
              },
            },
            {
              "name.english": {
                $regex: ".*" + searchString + ".*",
                $options: "i",
              },
            },
          ],
        },
      })
      .skip((page - 1) * limit) //Notice here
      .limit(limit)
      .lean();
    if (!product)
      return res.json({
        message: "Data not found",
        data: [],
      });
    console.log("--value", product);
    await Promise.all(
      product.map(async (element) => {
        var data = {};
        if (element._product) {
          var productId = element._product._id.toString();
          var productPrice = await _global.productprice(
            req.body._store,
            productId
          );

          data = {
            ...element,
          };
          (data._product.image = `${process.env.IMAGES_BUCKET_PATH}/products/${element._product.image}`),
            (data._product.deal_price = productPrice.deal_price.toFixed(2)),
            (data._product.regular_price =
              productPrice.regular_price.toFixed(2));
          delete data.regular_price;
          search_product.push(data);
        }
      })
    );

    let total = await ProductRegularPricing.find({
      _store: req.body._store,
    }).populate({
      path: "_product",
      match: {
        $or: [
          {
            description: {
              $regex: ".*" + searchString + ".*",
              $options: "i",
            },
          },
          {
            "name.english": {
              $regex: ".*" + searchString + ".*",
              $options: "i",
            },
          },
        ],
      },
    });
    const result = total.filter((word) => word._product != null);
    return res.json({
      draw: page,
      recordsTotal: result.length,
      recordsFiltered: result.length,
      data: search_product,
    });
  } catch (err) {
    console.log("--logs", err);
    return res.status(404).json({
      message: err.message,
    });
  }
};
