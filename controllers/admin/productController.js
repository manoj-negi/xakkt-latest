const ProductCategory = require("../../models/product_category");
const Product = require("../../models/product");
const User = require("../../models/user");
const Brand = require("../../models/brand");
const Deals = require("../../models/deal");
const Unit = require("../../models/unit");
var ObjectId = require("mongoose").Types.ObjectId;
const Wishlist = require("../../models/wishlist");
const Stores = require("../../models/store");
const StoreProductPricing = require("../../models/store_product_pricing");
const RegularPrice = require("../../models/product_regular_pricing");
const _globalCommon = require("../../helper/common");
const { validationResult } = require("express-validator");
var moment = require("moment");
const _global = require("../../helper/notification");
const pushController = require("../api/pushController");
const EventEmitter = require("events");
const emitter = new EventEmitter();
const imageUpload = require("../../helper/imageUpload");
const uploadController = require("./uploadController");
/*
 * View of product category
 */
exports.cronWishlist = async (req, res) => {
  emitter.on("cronWishlist", async (req, res) => {
    let wishlist = await Wishlist.find().lean();
    var users = [];
    for (const wishlistElem of wishlist) {
      const productStorePriceData = await StoreProductPricing.findOne({
        _product: wishlistElem._product,
        _store: wishlistElem._store,
      });
      const productRegularPriceData = await ProductRegularPricing.findOne({
        _product: wishlistElem._product,
        _store: wishlistElem._store,
      });
      const productregularprice = productRegularPriceData
        ? productRegularPriceData.regular_price
        : 0;
      const storedealprice = productStorePriceData
        ? productStorePriceData.deal_price
        : 0;

      if (
        wishlistElem.wish_price <= storedealprice ||
        wishlistElem.wish_price <= productregularprice
      ) {
        users.push(wishlistElem._user);
        //send push to user in this case
        pushController.firebase(wishlistElem._user, "Deal Price");
      }
    }
    return true;
    // return res.status(200).json({ status: 1, message: users });
  });
  emitter.emit("cronWishlist", { data: "Data" });
};
exports.create = async (req, res) => {
  try {
    var categories = await ProductCategory.find({}).lean();

    res.render("admin/product-category/create", {
      menu: "productCategory",
      submenu: "create",
      categories: categories,
    });
  } catch (err) {
    res.status(400).json({ data: err.message });
  }
};
/*
 *  Form of product
 */
(exports.productCreate = async (req, res) => {
  try {
    var brands = await Brand.find({}).lean();
    var deals = await Deals.find({}).lean();
    var unit = await Unit.find({}).lean();
    var productCategories = await ProductCategory.find({}).lean();
    return res.render("admin/product/create", {
      menu: "products",
      submenu: "create",
      brands: brands,
      unit: unit,
      deals: deals,
      productCategories: productCategories,
    });
  } catch (err) {
    res.status(400).json({ data: err.message });
  }
}),
  /*
   * Add new Product Category
   *params[name,filename]
   */
  (exports.save = async (req, res) => {
    try {
      var categoryInfo = {
        name: req.body.name,
        logo: req.file?.filename ?? "",
        parent_id: req.body.parentid,
        slug: req.body.slug,
      };
      categoryInfo = Object.entries(categoryInfo).reduce(
        (a, [k, v]) => (v ? ((a[k] = v), a) : a),
        {}
      );

      await ProductCategory.create(categoryInfo);
      const folder = "product_category/";
      await imageUpload.uploadNew(req, folder);
      await req.flash("success", "ProductCategory added successfully!");
      res.redirect("/admin/category");
    } catch (err) {
      console.log(err, "=======>>");
      await req.flash("failure", err.message);
      res.redirect("/admin/category");
    }
  });
/*
 *Listing of Product Category
 */
exports.list = async (req, res) => {
  try {
    let productCategory = await ProductCategory.find()
      .sort({ name: 1 })
      .populate("parent_id", "name")
      .lean();

    if (!productCategory.length)
      return res.render("admin/product-category/listing", {
        menu: "productCategory",
        submenu: "list",
        productCategory: "",
        success: await req.consumeFlash("success"),
        failure: await req.consumeFlash("failure"),
      });
    return res.render("admin/product-category/listing", {
      menu: "productCategory",
      submenu: "list",
      productCategory: productCategory,
      success: await req.consumeFlash("success"),
      failure: await req.consumeFlash("failure"),
    });
  } catch (err) {
    res.status(400).json({ status: "success", message: err });
  }
};
/*
 *Delete Product Category using productcategory id
 *params[req.params.id]
 */
exports.delete = async (req, res) => {
  ProductCategory.deleteOne({ _id: req.params.id }, function (err) {
    if (err) return res.status(400).json({ data: err });
    req.flash("success", "Product deleted successfully!");
    res.redirect("/admin/category");
  });
};
/*
 *View product category detail
 *params:[req.params.id]
 */
exports.edit = async (req, res) => {
  try {
    var allCategories = await ProductCategory.find({}).lean();
    const productCategory = await ProductCategory.findById(
      req.params.id
    ).exec();
    res.render("admin/product-category/edit", {
      status: "success",
      message: "",
      productCategory: productCategory,
      allCategories: allCategories,
      menu: "productCategory",
      submenu: "create",
    });
  } catch (err) {
    res.status(400).json({ status: "false", data: err });
  }
};
/*
 *Update product category
 */
exports.update = async function (req, res) {
  try {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    var categoryInfo = {
      name: req.body.name,
      parent_id: req.body.parentid,
      logo: req.file?.filename,
      slug: req.body.slug,
    };

    categoryInfo = Object.entries(categoryInfo).reduce(
      (a, [k, v]) => (v ? ((a[k] = v), a) : a),
      {}
    );

    const productCategory = await ProductCategory.findByIdAndUpdate(
      { _id: req.params.id },
      categoryInfo,
      { new: true, upsert: true }
    );
    const folder = "product_category/";
    await imageUpload.uploadNew(req, folder);
    if (productCategory) {
      await req.flash("success", "Product updated successfully!");
      res.redirect("/admin/category");
    } else {
      return res
        .status(400)
        .json({ status: false, message: "ProductCategory not found" });
    }
  } catch (err) {
    console.log(err);
    await req.flash("failure", err.message);
    res.redirect("/admin/category");
  }
};
/*
 *Create new product
 */
exports.productsave = async (req, res) => {
  //   console.log(req);
  try {
    const productinfo = {
      name: {
        english: req.body.en_name,
      },
      description: req.body.description,
      // sku: req.body.sku,
      _category: req.body._category,
      slug: req.body.slug,
      weight: req.body.weight,
      _company: req.session.company,
      short_description: req.body.short_description,
      is_featured: req.body.is_featured,
      _unit: req.body.unit,
      price: req.body.price,
      cuisine: req.body.cuisine || null,
      trending: req.body.trending,
      status: req.body.status,
      brand_id: req.body.brand || null,
    };
    productinfo.image = req.file.filename
      ? req.file.filename
      : "no-image_1606218971.jpeg";
    productinfo.parent_id = req.body.parent_id ? req.body.parent_id : null;

    const folder = "products/";
    await imageUpload.uploadNew(req, folder);

    const product = await Product.create(productinfo);
    await ProductCategory.findByIdAndUpdate(
      { _id: req.body._category },
      { $push: { _products: product._id } }
    );
    res.redirect("/admin/regularprice/create/" + product._id);
  } catch (err) {
    await req.flash("failure", err.message);
    res.redirect("/admin/product");
  }
};
/*
 * Product listing
 */
exports.productlisting = async (req, res) => {
  try {
    var cond = req.session.roles.includes("system_admin")
      ? {}
      : { _id: { $in: req.session.stores } };
    let stores = await Stores.find(cond).exec();
    return res.render("admin/product/listing", {
      menu: "products",
      submenu: "list",
      product: "",
      price: "",
      store: stores,
      success: await req.consumeFlash("success"),
      failure: await req.consumeFlash("failure"),
    });
  } catch (err) {
    res.status(400).json({ data: err.message });
  }
};
/*
*Delete product 
params:[req.params.id]
*/
exports.productdelete = async (req, res) => {
  Product.deleteOne({ _id: req.params.id }, function (err) {
    if (err) return res.status(400).json({ data: err });
    req.flash("success", "Product deleted successfully!");
    res.redirect("/admin/product");
  });
};
/*
 * View product
 *param:[req.params.id]
 */
exports.productedit = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).exec();
    var brands = await Brand.find({}).lean();
    var deals = await Deals.find({}).lean();
    var unit = await Unit.find({}).lean();
    var productCategories = await ProductCategory.find({}).lean();
    res.render("admin/product/edit", {
      status: "success",
      message: "",
      brands: brands,
      deals: deals,
      unit: unit,
      product: product,
      productCategories: productCategories,
      menu: "Product",
    });
  } catch (err) {
    res.status(400).json({ status: "false", data: err });
  }
};
/*
 * Update product
 * params:[en_name,description,sku,_category,weight,short_description,is_featured,price,status]
 */
exports.productupdate = async function (req, res) {
  try {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productinfo = {
      name: {
        english: req.body.en_name,
      },
      description: req.body.description,
      // sku: req.body.sku,
      _category: req.body._category,
      weight: req.body.weight,
      slug: req.body.slug,
      short_description: req.body.short_description,
      is_featured: req.body.is_featured,
      price: req.body.price,
      _unit: req.body.unit,
      cuisine: req.body.cuisine || null,
      trending: req.body.trending,
      status: req.body.status,
      brand_id: req.body.brand || null,
    };
    if (req.file) {
      productinfo.image = req.file.filename;
      const folder = "products/";
      await imageUpload.uploadNew(req, folder);
    }

    const product = await Product.findByIdAndUpdate(
      { _id: req.params.id },
      productinfo,
      { new: false, upsert: true }
    );

    if (product) {
      //db.getCollection('productcategories').aggregate([{'$addFields': {'_products': {'$setUnion': ['$_products', []]}}}])
      await ProductCategory.findByIdAndUpdate(
        { _id: product._category },
        { $pull: { _products: product._id } }
      );
      await ProductCategory.findByIdAndUpdate(
        { _id: req.body._category },
        { $push: { _products: product._id } }
      );

      await req.flash("success", "Product updated successfully!");
      res.redirect("/admin/product");
    } else {
      await req.flash("failure", "Something is wrong");
      res.redirect("/admin/product");
    }
  } catch (err) {
    await req.flash("failure", err.message);
    res.redirect("/admin/product");
  }
};
/*
 * delete storeproduct price
 *params[id]
 */
exports.remove = async (req, res) => {
  try {
    let remove = await StoreProductPricing.deleteOne({
      _id: req.body._id,
    }).exec();
    if (!remove) return res.json({ status: false });
    return res.json({ status: true });
  } catch (err) {
    res.send(err);
  }
};
/*
 * Add deal price
 * params[no_of_stores,deal,deal_price,deal_value,stime,etime,store,productid]
 */
exports.priceSave = async (req, res) => {
  try {
    const arr = [];

    for (i = 0; i < req.body.no_of_stores; i++) {
      data = {};
      data._deal = req.body.deal[i];
      // data.deal_price = req.body.deal_price[i];
      data.deal_percentage = req.body.deal_value[i];
      data.deal_price = parseFloat(req.body.deal_price[i]).toFixed(2);
      data.deal_start = moment(req.body.stime[i]).startOf("day").toISOString();
      data.deal_end = moment(req.body.etime[i]).endOf("day").toISOString();
      data._store = req.body.store[i];
      data._product = req.body.productid;
      arr.push(data);
      await _global.wishlist(
        req.body.store[i],
        req.body.productid,
        req.body.deal_price[i]
      );
      const bannerinfo = {
        _deal: req.body.deal[i],
        _store: req.body.store[i],
        deal_start: moment(req.body.stime[i]).startOf("day").toISOString(),
        deal_end: moment(req.body.etime[i]).endOf("day").toISOString(),
      };
      const banner = {
        _deal: req.body.deal[i],
        _store: req.body.store[i],
        deal_end: {
          $gte: moment(req.body.stime[i]).startOf("day").toISOString(),
        },
      };

      await StoreProductPricing.deleteOne({
        _store: req.body.store[i],
        _product: req.body.productid,
      }).exec();
    }

    var productprice = await StoreProductPricing.insertMany(arr);
    uploadController.cronWishlist(req, res);
    if (!productprice) {
      await req.flash("failure", "Product price");
      res.redirect("/admin/product");
    }
    res.redirect("/admin/product");
  } catch (err) {
    console.log("===validation", err);
    res.send(err);
  }
};

/*
 * product price view
 * get regular_price with store list
 * params[req.params.productid]
 */
exports.addPrice = async (req, res) => {
  try {
    var prices = [];
    var deal = [];
    var product = await Product.findOne({ _id: req.params.productid }).lean();
    var brands = await Brand.find({}).lean();
    var deals = await Deals.find({})
      .collation({ locale: "en" })
      .sort({ name: 1 })
      .lean();

    if (req.session.roles.includes("system_admin")) {
      var stores = await Stores.find({})
        .select("name _currency")
        .populate("_currency")
        .collation({ locale: "en" })
        .sort({ name: 1 })
        .lean();
      userStores = stores;
    } else {
      var stores = await User.findOne({ _id: req.session.userid })
        .select(
          "-_id -password -role_id -coupons -last_login -updatedAt -createdAt -ncrStatus"
        )
        .populate({
          path: "_store",
          select: "name _currency",
          options: { sort: { name: 1 } },
          populate: { path: "_currency" },
        })
        .lean();
      userStores = stores._store;
    }

    var storesIds = userStores.map((store) => store._id);

    let productPrice = await StoreProductPricing.find({
      _store: { $in: storesIds },
      _product: req.params.productid,
    })
      .populate({
        path: "_store",
        select: "name _currency",
        options: { sort: { name: 1 } },
        populate: { path: "_currency", select: "name" },
      })
      .lean({ getters: true });

    let regularPrice = await RegularPrice.find({
      _store: { $in: storesIds },
      _product: req.params.productid,
    }).lean({ getters: true });

    let storeData = [];
    productPrice.map((price) => {
      pricingData = {};
      regularPrice.map((regPrice) => {
        if (regPrice._store.equals(price._store._id)) {
          pricingData = {
            ...price,
            regularprice: regPrice.regular_price,
            storeId: price._store._id,
            storeName: price._store.name,
            _currency: price._store._currency.name,
          };
          delete pricingData._store;
          delete pricingData.createdAt;
          delete pricingData.updatedAt;
          delete pricingData.__v;
        }
      });
      storeData.push(pricingData);
      //console.log(price._store._id,"==========",regularPricee)
    });

    // this.cronWishlist(req, res);
    //return res.json(storeData)
    res.render("admin/product/pricing", {
      menu: "ProductCategory",
      productName: product,
      productid: req.params.productid,
      brands: brands,
      deals: deals,
      storeData: storeData,
      stores: userStores,
      moment: moment,
      success: await req.consumeFlash("success"),
      failure: await req.consumeFlash("failure"),
    });
  } catch (err) {
    res.status(400).json({ data: err.message });
  }
};
exports.product_listing = async (req, res) => {
  try {
    var pagno = req.query.start / req.query.length + 1;
    var page = parseInt(req.query.draw) || 1; //for next page pass 1 here
    var limit = parseInt(req.query.length) || 5;
    let searchString = req.query.search.value || "";
    if (req.query._store) {
      let productId = await RegularPrice.find({ _store: req.query._store }, [
        "_product",
      ]);
      let _product = [];
      productId.map((item) => {
        _product.push(item._product);
      });
      var where = {
        _id: { $in: _product },
        $or: [
          {
            description: { $regex: ".*" + searchString + ".*", $options: "i" },
          },
          { "name.english": { $regex: searchString, $options: "i" } },
        ],
      };
      let product = await Product.find(where)
        .skip((pagno - 1) * limit) //Notice here
        .limit(limit)
        .lean();
      let total = await Product.find(where).lean();
      return res.json({
        draw: page,
        recordsTotal: total.length,
        recordsFiltered: total.length,
        data: product,
      });
    } else {
      let productForSpecificCompany;
      if (req.session.company) {
        productForSpecificCompany = await _globalCommon.companyStore(req);
      }
      var where = {
        $or: [
          {
            description: { $regex: ".*" + searchString + ".*", $options: "i" },
          },
          { "name.english": { $regex: searchString, $options: "i" } },
          { _id: { $in: productForSpecificCompany } },
        ],
      };

      let product = await Product.find(where)
        .populate("brand_id", "name status")
        .populate("_unit", "name")
        .skip((pagno - 1) * limit) //Notice here
        .limit(limit)
        .lean();

      let total = await Product.find(where)
        .populate("brand_id", "name status")
        .populate("_unit", "name")
        .lean();

      return res.json({
        draw: page,
        recordsTotal: total.length,
        recordsFiltered: total.length,
        data: product,
      });
    }
  } catch (err) {
    res.status(400).json({ data: err.message });
  }
};
exports.product_delete = async (req, res) => {
  try {
    let remove = await Product.deleteMany({ _id: { $in: req.body.id } }).exec();
    if (!remove) return res.json({ status: false });
    return res.json({ status: true });
  } catch (err) {
    res.send(err);
  }
};
exports.unique_sku = async (req, res) => {
  try {
    let sku = await Product.findOne({ sku: req.body.sku }).lean();
    if (sku) return res.send({ status: false });

    return res.send({ status: true });
  } catch (err) {
    res.send(err);
  }
};
