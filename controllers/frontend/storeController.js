const Department = require("../../models/department");
const Product = require("../../models/product");
const Store = require("../../models/store");
const Cart = require("../../models/cart");

const Categories = require("../../models/product_category");
const Brands = require("../../models/brand");
const StoreProductPricing = require("../../models/store_product_pricing");
const ProductRegularPricing = require("../../models/product_regular_pricing");
const _global = require("../../helper/common");
var moment = require("moment");
const Banner = require("../../models/banner");

function getUniqueListBy(product, key) {
  return [...new Map(product.map((item) => [item[key], item])).values()];
}

exports.homepage = async (req, res) => {
  let stores = await Store.find().lean();
  if (stores) return res.render("frontend/index", { stores: stores });
};

exports.productDetails = async (req, res) => {
  try {
    let store = await Store.findOne({ slug: req.params.store })
      .populate({
        path: "_currency",
        select: "name",
      })
      .lean();
    let product = await Product.findOne({ slug: req.params.product })
      .populate({
        path: "_unit",
        select: "name",
      })
      .lean();

    is_favourite = 0;
    in_shoppinglist = 0;
    in_cart = 0;

    if (res.locals.userid) {
      cartProductList = await _global.cartProducts(
        res.locals.userid,
        store._id
      );
      wishlistids = await _global.wishList(res.locals.userid, store._id);
      shoppinglistProductIds = await _global.shoppingList(
        res.locals.userid,
        store._id
      );

      in_cart =
        product._id in cartProductList ? cartProductList[product._id] : 0;
      in_shoppinglist = shoppinglistProductIds.includes(product._id.toString())
        ? 1
        : 0;
      is_favourite = wishlistids.includes(product._id.toString()) ? 1 : 0;
    }

    var productPrice = await _global.productprice(store._id, product._id);
    return res.render("frontend/product-details", {
      store: store,
      data: {
        product: {
          info: product,
          price: productPrice,
          in_shoppinglist: in_shoppinglist,
          is_favourite: is_favourite,
          in_cart: in_cart,
        },
      },
    });
  } catch (err) {
    console.log("===>>", err);
    res.status(400).json({
      status: 0,
      message: "SOMETHING_WENT_WRONG",
      data: err,
    });
  }
};

exports.products = async (req, res) => {
  var userid = res.locals.userid;
  var pdata = [];
  var product = [];

  //await _time.store_time(req.params.storeid)
  var date = moment().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
  try {
    let storedata = await Store.findOne({ slug: req.params.slug })
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
        data: "	Store does not exists",
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

        if (dealProducts) bannerArr.push(banner);
      })
    );

    var _banners = [
      {
        _id: "60b942742527aa36d0ba23",
        type: "default",
        _deal: "",
        image: "default.jpg",
      },
      {
        _id: "60b942742527aa36d0ba23",
        type: "default",
        _deal: "",
        image: "default_one.jpg",
      },
    ];

    /* ------------- code for banners ---------*/

    if (!bannerArr.length) {
      //banners.concat(_banners)
      pdata[0] = {
        path: `${process.env.IMAGES_BUCKET_PATH}/banners/`,
        type: "banner1",
        message: "No banner found",
        banner: _banners,
      };
    } else {
      pdata[0] = {
        path: `${process.env.IMAGES_BUCKET_PATH}/banners/`,
        type: "banner2",
        banner: bannerArr.reverse(),
      };
    }

    //	const mergedArray = [...banners, ..._banners];
    /* ----------------- end of code for banners ----------*/

    let categories = await StoreProductPricing.find({
      _store: storedata._id,
    })
      .populate({
        path: "_product",
        select: "name sku image weight slug",
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
      cartProductList = await _global.cartProducts(userid, storedata._id);
      wishlistids = await _global.wishList(userid, storedata._id);
      shoppinglistProductIds = await _global.shoppingList(
        userid,
        storedata._id
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
            storedata._id,
            productId
          );

          if (productPrice) {
            deal_name = element._deal.name;
            data = {
              ...data,
              type: "product",
              _id: element._product._id,
              slug: element._product.slug,
              name: element._product.name,
              unit: element._product._unit?.name ?? "n/a",
              weight: element._product.weight,
              sku: element._product.sku,
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
    pdata[3] = {
      path: `${process.env.IMAGES_BUCKET_PATH}/products/`,
      type: "product",
      sub_type: "order_again",
      message: "You have not placed any orders in the last 90 days",
      product: orderAgain,
    };
    /*--------- order again --------*/

    /*--------- trending products --------*/

    var trendingProducts = [];
    let allTrendings = await Product.find({
      trending: true,
    })
      .distinct("_id")
      .lean({ getter: true });
    let allTrendingIds = allTrendings.map((x) => x.toString());

    let storeTrending = await ProductRegularPricing.find({
      _store: storedata._id,
      _product: { $in: allTrendingIds },
    }).populate({
      path: "_product",
      select: "name slug sku image trending weight",
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
            storedata._id,
            productId
          );

          data = {
            ...data,
            type: "product",
            _id: element._product._id,
            name: element._product.name,
            slug: element._product.slug,
            unit: element._product._unit?.name ?? "n/a",
            weight: element._product.weight,
            sku: element._product.sku,
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

    /*  return res.json({
			status: 1,
			data: pdata, 
			store:storedata
		})    */
    let parentCatogories = await Categories.find({ parent_id: { $eq: null } })
      .select("-_products -createdAt -updatedAt -__v")
      .lean();

    parentCategory = [];
    await Promise.all(
      parentCatogories.map(async function (element) {
        chilCategories = await Categories.find({ parent_id: element._id })
          .select("-_products -createdAt -updatedAt -__v")
          .lean();
        var categorySet = {};
        categorySet.name = element.name;
        categorySet.subcategory = chilCategories;
        categorySet.parent_slug = element.slug;
        parentCategory.push(categorySet);
        //chilCategories=chilCategories.map(v => ({...v, parentSlug: element.slug}))
        //categorySet[element.name] = chilCategories
      })
    );
    return res.render("frontend/products", {
      banners: pdata[0],
      deal: pdata[2],
      order_again: pdata[3],
      store: storedata,
      categories: parentCategory,
      trending: pdata[1],
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
