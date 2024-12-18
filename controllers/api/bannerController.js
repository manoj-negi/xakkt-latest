const Banner = require("../../models/banner");
const StoreProductPricing = require("../../models/store_product_pricing");
var moment = require("moment");
const _global = require("../../helper/common");
const _time = require("../../helper/storetimezone");

exports.bannderproduct = async (req, res) => {
  try {
    var storePrice = [];
    await _time.store_time(req.body._store);
    var date = moment().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
    let store = await StoreProductPricing.find({
      $and: [
        { _store: req.body._store },
        { _deal: req.body._deal },
        { deal_start: { $lte: date } },
        { deal_end: { $gte: date } },
      ],
    })
      .select("-createdAt -updatedAt -__v")
      .populate({
        path: "_product",
        select: "name image unit weight description",
        populate: {
          path: "_unit",
          select: "name",
        },
      })
      .populate("_store", "name city state unit weight description")
      .populate("_deal", "name city state _currency")
      .lean();

    await Promise.all(
      store.map(async (element) => {
        console.log("=====", element);
        var data = {};
        var _store = element._store;
        var _product = element._product._id;
        let productPrice = await _global.productprice(_store, _product);
        data = { ...element };
        data.dealType = element._deal.name;
        data.storeName = element._store.name;

        if (productPrice) {
          (data._product.image = `${process.env.IMAGES_BUCKET_PATH}/products/${element._product.image}`),
            (data._product.unit = element._product._unit.name);
          data._product.regular_price = productPrice.regular_price;
          data._product.deal_price = productPrice.deal_price;
          data._product.is_favourite = 0;
          data._product.in_shoppinglist = 0;
          data._product.in_cart = 0;
        }
        delete element._product._unit;
        delete data.deal_price;
        delete data._deal;
        delete data._store;
        storePrice.push(data);
      })
    );
    if (!store.length)
      return res.json({ status: 0, message: "Data not found" });
    return res.json({ status: 1, message: "Listing", data: storePrice });
  } catch (err) {
    console.log(err);
    return res.status(404).json({ status: 0, message: err });
  }
};
