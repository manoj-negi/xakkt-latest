const Product = require("../../models/product");
const ProductCategory = require("../../models/product_category");
const Store = require("../../models/store");
let jwt = require("jsonwebtoken");
const Banner = require("../../models/banner");
const _global = require("../../helper/common");
const Order = require("../../models/order");
const StoreProductPricing = require("../../models/store_product_pricing");
const ProductRegularPricing = require("../../models/product_regular_pricing");
var moment = require("moment");
const store = require("../../models/store");

function getUniqueListBy(product, key) {
  return [...new Map(product.map((item) => [item[key], item])).values()];
}

exports.dashboard = async (req, res) => {
  var userid;
  var pdata = [];
  var product = [];
  //await _time.store_time(req.params.storeid)
  var date = moment().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
  try {
    var userid;
    let token = req.headers["authorization"];
    if (token) {
      if (token.startsWith(process.env.JWT_SECRET)) {
        token = token.slice(7, token.length);
      }
      await jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (decoded) {
          userid = decoded.id;
        }
      });
    }
    let storedata = await Store.findOne({ _id: req.params.storeid })
      .select(
        "-time_schedule -_department -holidays -__v -createdAt -updatedAt -_user"
      )
      .populate({
        path: "_currency",
        select: "name",
      })
      .lean();
    if (!storedata) {
      return res.json({
        status: 0,
        data: "Store does not exists",
      });
    }
    let nearbystores = await Store.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: storedata.location.coordinates,
          },
          $maxDistance: 50000,
        },
      },
    }).select("name address city state contact_no");

    var storeId = [];
    nearbystores.filter((item) => {
      storeId.push(item._id);
    });
    var cartProductList = [];
    var wishlistids = [];
    var shoppinglistProductIds = [];

    let banners = await Banner.find({
      _store: {
        $in: storeId,
      },
    })
      .populate("_deal", "name")
      .lean();

    bannerArr = [];
    await Promise.all(
      banners.map(async function (banner) {
        let dealProducts = await StoreProductPricing.findOne({
          $and: [
            { _store: banner._store, _deal: banner._deal },
            { deal_start: { $lte: date } },
            { deal_end: { $gte: date } },
          ],
        }).lean();

        if (dealProducts) {
          bannerArr.push(banner);
        }
      })
    );

    _banners = [
      {
        _id: "60b942742527aa36d0ba23",
        type: "default",
        image: "default.jpg",
      },
      {
        _id: "60b942742527aa36d0ba23",
        type: "default",
        image: "default_one.jpg",
      },
    ];

    /* ------------- code for banners ---------*/

    if (!bannerArr.length) {
      //banners.concat(_banners)
      pdata[0] = {
        path: `${process.env.IMAGES_BUCKET_PATH}/banners/`,
        type: "banner",
        message: "No banner found",
        banner: _banners,
      };
    } else {
      pdata[0] = {
        path: `${process.env.IMAGES_BUCKET_PATH}/banners/`,
        type: "banner",
        banner: bannerArr.reverse(),
      };
    }

    //	const mergedArray = [...banners, ..._banners];
    /* ----------------- end of code for banners ----------*/

    let categories = await StoreProductPricing.find({
      _store: req.params.storeid,
    })
      .populate({
        path: "_product",
        select: "name sku image weight description",
        populate: {
          path: "_unit",
          select: "name",
        },
      })
      .populate({
        path: "_deal",
        select: "name",
      })
      .lean();

    if (userid) {
      cartProductList = await _global.cartProducts(userid, req.params.storeid);
      wishlistids = await _global.wishList(userid, req.params.storeid);
      shoppinglistProductIds = await _global.shoppingList(
        userid,
        req.params.storeid
      );
    }

    if (!categories.length) {
      pdata[2] = {
        path: `${process.env.IMAGES_BUCKET_PATH}/products/`,
        type: "product",
        sub_type: "Deals",
        message: "No Product on this store available",
        product: [],
      };
    } else {
      var deal_name = "";
      await Promise.all(
        categories.map(async (element) => {
          var data = {};
          var productId = element._product._id.toString();
          var productPrice = await _global.productprice(
            req.params.storeid,
            productId
          );

          if (productPrice) {
            deal_name = element._deal.name;
            data = {
              ...data,
              type: "product",
              _id: element._product._id,
              name: element._product.name,
              unit: element._product._unit?.name ?? "n/a",
              weight: element._product.weight,
              description: element._product.description,
              is_favourite: 0,
              in_shoppinglist: 0,
              in_cart: 0,
              image: `${process.env.IMAGES_BUCKET_PATH}/products/${element._product.image}`,
              deal_price: productPrice.deal_price,
              regular_price: productPrice.regular_price,
            };

            if (productId in cartProductList) {
              data.in_cart = cartProductList[productId];
            }

            if (
              wishlistids.includes(productId) &&
              shoppinglistProductIds.includes(productId)
            ) {
              (data.is_favourite = 1), (data.in_shoppinglist = 1);
            } else if (shoppinglistProductIds.includes(productId)) {
              data.in_shoppinglist = 1;
            } else if (wishlistids.includes(productId)) {
              data.is_favourite = 1;
            }
            product.push(data);
          } else {
            pdata[2] = {
              path: `${process.env.IMAGES_BUCKET_PATH}/products/`,
              type: "product",
              sub_type: "Deals",
              message: "No Product on this store available",
              product: [],
            };
          }
        })
      );
      product = getUniqueListBy(product, "_id");

      pdata[2] = {
        path: `${process.env.IMAGES_BUCKET_PATH}/products/`,
        type: "product",
        dealName: deal_name,
        sub_type: "Deals",
        product: product,
      };
    }

    /*--------- order again --------*/
    let orderAgain = [];

    if (userid) {
      var order = await Order.find({
        _user: userid,
        _store: req.params.storeid,
      })
        .select("-feedback -shipping -payment -createdAt -updatedAt -__v")
        .populate({
          path: "products._product",
          select: "name description _category weight _unit image quantity",
          populate: {
            path: "_unit",
            select: "name",
          },
        })
        .lean({ getters: true });

      await Promise.all(
        order.map(async (element) => {
          for (const [i, product] of element.products.entries()) {
            var productId = product._product._id.toString();
            var productPrice = await _global.productprice(
              req.params.storeid,
              productId
            );
            delete product._id;
            (producttype = "product"), (product._id = product._product._id);
            product.name = product._product.name;
            product.description = product._product.description;
            product.is_favourite = 0;
            product.in_shoppinglist = 0;
            product.in_cart = 0;
            //product._category = product._product._category
            product.weight = product._product.weight;
            product.unit = product._product._unit.name;
            product.image = product._product.image;
            product._product.deal_price = productPrice.deal_price;
            product._product.regular_price = productPrice.regular_price;

            product.is_favourite = wishlistids.includes(
              product._product._id.toString()
            )
              ? 1
              : 0;
            product.in_shoppinglist = shoppinglistProductIds.includes(
              product._product._id.toString()
            )
              ? 1
              : 0;
            product.in_cart =
              product._product._id in cartProductList
                ? cartProductList[product._product._id]
                : 0;

            delete product._product;
            delete product.quantity;

            var index = orderAgain.findIndex((x) => x._id == product._id);
            index === -1
              ? orderAgain.push(product)
              : console.log("object already exists");

            //orderAgain.push(product)
          }
        })
      );

      pdata[3] = {
        path: `${process.env.IMAGES_BUCKET_PATH}`,
        type: "product",
        sub_type: "order_again",
        message: "Order Again",
        product: orderAgain,
      };
    } else {
      pdata[3] = {
        path: `${process.env.IMAGES_BUCKET_PATH}`,
        type: "product",
        sub_type: "order_again",
        message: "You have not placed any orders in the last 90 days",
        product: orderAgain,
      };
    }

    /*--------- order again --------*/

    /*--------- trending products --------*/

    var trendingProducts = [];
    let allTrendings = await Product.find({
      trending: true,
    }).distinct("_id");
    let allTrendingIds = allTrendings.map((x) => x.toString());

    let storeTrending = await ProductRegularPricing.find({
      _store: req.params.storeid,
      _product: { $in: allTrendingIds },
    }).populate({
      path: "_product",
      select: "name sku image trending weight description",
      populate: {
        path: "_unit",
        select: "name",
      },
    });

    if (!storeTrending.length) {
      pdata[1] = {
        path: `${process.env.IMAGES_BUCKET_PATH}/products/`,
        type: "product",
        sub_type: "trending",
        message: "No trending product available",
        product: [],
      };
    } else {
      trendingProducts = [];
      await Promise.all(
        storeTrending.map(async (element) => {
          var data = {};
          var productId = element._product._id.toString();
          var productPrice = await _global.productprice(
            req.params.storeid,
            productId
          );

          data = {
            ...data,
            type: "product",
            _id: element._product._id,
            name: element._product.name,
            unit: element._product._unit?.name ?? "n/a",
            weight: element._product.weight,
            description: element._product.description,
            is_favourite: 0,
            in_shoppinglist: 0,
            in_cart: 0,
            image: element._product.image,
            deal_price: productPrice.deal_price,
            regular_price: productPrice.regular_price,
          };

          if (productId in cartProductList) {
            data.in_cart = cartProductList[productId];
          }

          if (
            wishlistids.includes(productId) &&
            shoppinglistProductIds.includes(productId)
          ) {
            (data.is_favourite = 1), (data.in_shoppinglist = 1);
          } else if (shoppinglistProductIds.includes(productId)) {
            data.in_shoppinglist = 1;
          } else if (wishlistids.includes(productId)) {
            data.is_favourite = 1;
          }
          trendingProducts.push(data);
        })
      );

      pdata[1] = {
        path: `${process.env.IMAGES_BUCKET_PATH}/products/`,
        type: "product",
        sub_type: "trending",
        product: trendingProducts,
      };
    }

    /*-------- trending products ------*/

    return res.json({
      status: 1,
      data: pdata,
      store: storedata,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: 0,
      message: "SOMETHING_WENT_WRONG",
      data: err,
    });
  }
};
