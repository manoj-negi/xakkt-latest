const Store = require("../../models/store");
const Categories = require("../../models/product_category");
const StoreProductPricing = require("../../models/store_product_pricing");
const _global = require("../../helper/common");
var moment = require("moment");
const Banner = require("../../models/banner");
const ProductCategory = require("../../models/product_category");

(exports.productbyParentCategoryy = async function (req, res) {
  try {
    var pageNo = req.query.page ? parseInt(req.query.page) : 1;

    const pc = await ProductCategory.findById(req.params.id)
      .select("_products")
      .populate("_products");
    totalItem = pc._products.length;
    var option = { sort: { "name.english": 1 } };
    option.limit = 4;

    if (pageNo != 1) {
      option.skip = option.limit * (pageNo - 1);
    }

    const category = await ProductCategory.find({
      $or: [{ parent_id: req.params.id }, { _id: req.params.id }],
    })
      .populate({
        path: "_products",
        select:
          "-crv -meta_description -_category -__v -cuisine -brand_id -createdAt -updatedAt -meta_title -meta_keywords",
        populate: { path: "_unit", select: "-createdAt -updatedAt -__v" },
      })
      .lean();

    var bigArr = [];
    category.map((data) => {
      bigArr = bigArr.concat(data._products);
    });

    var storeProduct = [];
    await Promise.all(
      bigArr.map(async (product) => {
        var data = {};
        var productId = product._id.toString();
        var productPrice = await _global.productprice(
          req.query._store,
          productId
        );

        if (productPrice) {
          data = {
            ...data,
            _id: product._id,
            name: product.name,
            unit: product._unit?.name ?? "n/a",
            weight: product.weight,
            description: product.description,
            is_favourite: 0,
            in_shoppinglist: 0,
            in_cart: 0,
            image: product.image,
            deal_price: productPrice.deal_price,
            regular_price: productPrice.regular_price,
          };
        } else {
          data = {
            ...data,
            _id: product._id,
            name: product.name,
            unit: product._unit?.name ?? "n/a",
            weight: product.weight,
            description: product.description,
            is_favourite: 0,
            in_shoppinglist: 0,
            in_cart: 0,
            image: product.image,
          };
        }

        storeProduct.push(data);
      })
    );

    var result = {};
    result.status = 1;
    var totalPages = Math.ceil(totalItem / option.limit);
    if (totalPages - 1 != pageNo) result.nextPage = pageNo + 1;
    result.data = storeProduct;

    return res.json({ data: result });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err });
  }
}),
  (exports.productbyParentCategory = async (req, res) => {
    var userid = res.locals.userid ?? req.sessionId;
    var pdata = [];
    var product = [];
    //await _time.store_time(req.params.storeid)
    var date = moment().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
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
          path: `${process.env.BASE_URL}/banners/`,
          type: "banner1",
          message: "No banner found",
          banner: _banners,
        };
      } else {
        pdata[0] = {
          path: `${process.env.BASE_URL}/banners/`,
          type: "banner2",
          banner: bannerArr.reverse(),
        };
      }

      //	const mergedArray = [...banners, ..._banners];
      /* ----------------- end of code for banners ----------*/

      var pageNo = req.query.page ? parseInt(req.query.page) : 1;
      const pc = await ProductCategory.findOne({
        slug: req.params.category,
      }).populate("_products");

      console.log("====>>", req.params.category);

      if (!pc) {
        res
          .status(400)
          .json({ status: 0, message: "No Categroy found with this name" });
      }
      totalItem = pc._products.length;
      var option = { sort: { "name.english": 1 } };
      option.limit = 18;

      if (pageNo != 1) {
        option.skip = option.limit * (pageNo - 1);
      }

      // const category = await ProductCategory.find({$or: [{parent_id:req.params.id},{_id:req.params.id}]})
      // .populate({
      // 	path:'_products',
      // 	select:'-crv -meta_description -_category -__v -cuisine -brand_id -createdAt -updatedAt -meta_title -meta_keywords',
      // 	populate:{ path:'_unit', select:'-createdAt -updatedAt -__v'}
      // }).lean()

      const category = await ProductCategory.findOne({
        slug: req.params.category,
      }).lean();
      const allCategory = await ProductCategory.find({
        parent_id: category._id,
      })
        .populate({
          path: "_products",
          select:
            "-crv -meta_description -_category -__v -cuisine -brand_id -createdAt -updatedAt -meta_title -meta_keywords",
          populate: { path: "_unit", select: "-createdAt -updatedAt -__v" },
        })
        .lean();

      var bigArr = [];
      allCategory.map((data) => {
        bigArr = bigArr.concat(data._products);
      });
      //return res.json({data:bigArr})
      var storeProduct = [];
      await Promise.all(
        bigArr.map(async (product) => {
          var data = {};
          var productId = product._id.toString();
          var productPrice = await _global.productprice(
            storedata._id,
            productId
          );

          if (productPrice) {
            data = {
              ...data,
              _id: product._id,
              name: product.name,
              slug: product.slug,
              unit: product._unit?.name ?? "n/a",
              weight: product.weight,
              description: product.description,
              is_favourite: 0,
              in_shoppinglist: 0,
              in_cart: 0,
              in_store: 1,
              image: product.image,
              deal_price: productPrice.deal_price,
              regular_price: productPrice.regular_price,
            };
          } else {
            data = {
              ...data,
              _id: product._id,
              name: product.name,
              unit: product._unit?.name ?? "n/a",
              weight: product.weight,
              description: product.description,
              is_favourite: 0,
              in_shoppinglist: 0,
              in_cart: 0,
              in_store: 0,
              image: product.image,
            };
          }

          storeProduct.push(data);
        })
      );

      let productCatogories = await Categories.find({ parent_id: pc._id })
        .populate("parent_id", "slug name")
        .lean();
      var result = {};
      parentCategory = productCatogories.length
        ? productCatogories[0].parent_id
        : "";
      result.data = storeProduct;
      var totalPages = Math.ceil(totalItem / option.limit);

      result.banners = pdata[0];
      result.store = storedata;
      result.storeProducts = storeProduct;
      result.categories = productCatogories;
      result.parentCategory = parentCategory;
      result.totalPages = totalPages;
      result.currentPage = pageNo;
      result.storeSlug = req.params.store;
      result.categorySlug = req.params.category;

      if (pageNo > 1) result.pre = pageNo - 1;
      if (pageNo < totalPages) result.next = pageNo + 1;
      return res.render("frontend/category-product", result);
    } catch (err) {
      console.log("======pppp", err);
      res.status(400).json({
        status: 0,
        message: "SOMETHING_WENT_WRONG",
        data: err,
      });
    }
  }),
  (exports.categoryProducts = async (req, res) => {
    console.log("==========category");
    var userid = res.locals.userid ?? req.sessionId;
    var pdata = [];
    var product = [];
    //await _time.store_time(req.params.storeid)
    var date = moment().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
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
          path: `${process.env.BASE_URL}/banners/`,
          type: "banner1",
          message: "No banner found",
          banner: _banners,
        };
      } else {
        pdata[0] = {
          path: `${process.env.BASE_URL}/banners/`,
          type: "banner2",
          banner: bannerArr.reverse(),
        };
      }

      //	const mergedArray = [...banners, ..._banners];
      /* ----------------- end of code for banners ----------*/

      var pageNo = req.query.page ? parseInt(req.query.page) : 1;
      const pc = await ProductCategory.findOne({
        slug: req.params.category,
      }).populate("_products");
      // console.log("==========wwwww",pc)
      totalItem = pc._products.length;
      var option = { sort: { "name.english": 1 } };
      option.limit = 18;

      if (pageNo != 1) {
        option.skip = option.limit * (pageNo - 1);
      }

      const categories = await ProductCategory.findOne({
        slug: req.params.category,
      })
        .populate({
          path: "_products",
          select: "-crv -meta_description -_category",
          model: "Product",
          options: option,
          populate: { path: "_unit" },
        })
        .lean();

      var storeProduct = [];

      if (!categories)
        return res.json({ status: 0, message: "Category not available" });
      //return res.json({data:categories})

      await Promise.all(
        categories._products.map(async (product) => {
          var data = {};
          var productId = product._id.toString();
          var productPrice = await _global.productprice(
            storedata._id,
            productId
          );
          if (!productPrice) {
            data = {
              ...data,
              _id: product._id,
              name: product.name,
              unit: product._unit?.name ?? "n/a",
              weight: product.weight,
              is_favourite: 0,
              in_shoppinglist: 0,
              in_cart: 0,
              image: product.image,
            };
          } else {
            data = {
              ...data,
              _id: product._id,
              name: product.name,
              unit: product._unit?.name ?? "n/a",
              weight: product.weight,
              is_favourite: 0,
              in_shoppinglist: 0,
              in_cart: 0,
              image: product.image,
              deal_price: productPrice.deal_price,
              regular_price: productPrice.regular_price,
              description: product.description,
            };
          }

          /*if (productId in cartProductList) {
                data.in_cart = cartProductList[productId]
            }

            if (wishlistids.includes(productId) && shoppinglistProductIds.includes(productId)) {
                data.is_favourite = 1,
                data.in_shoppinglist = 1
            } else if (shoppinglistProductIds.includes(productId)) {
                data.in_shoppinglist = 1
            } else if (wishlistids.includes(productId)) {
                data.is_favourite = 1
            } */
          storeProduct.push(data);
        })
      );

      let productCatogories = await Categories.find({
        parent_id: categories.parent_id,
      })
        .populate("parent_id", "slug name")
        .lean();

      var result = {};

      result.data = storeProduct;
      var totalPages = Math.ceil(totalItem / option.limit);

      result.banners = pdata[0];
      result.store = storedata;
      result.storeProducts = storeProduct;
      result.categories = productCatogories;
      result.parentCategory = productCatogories[0].parent_id;
      result.totalPages = totalPages;
      result.currentPage = pageNo;
      result.storeSlug = req.params.store;
      result.categorySlug = req.params.category;

      if (pageNo > 1) result.pre = pageNo - 1;
      if (pageNo < totalPages) result.next = pageNo + 1;

      return res.render("frontend/category-product", result);
    } catch (err) {
      console.log(err);
      res.status(400).json({
        status: 0,
        message: "SOMETHING_WENT_WRONG",
        data: err,
      });
    }
  });
