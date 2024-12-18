const Product = require("../../models/product");
const Queue = require("../../models/queue");
const Brand = require("../../models/brand");
const ProductRegularPricing = require("../../models/product_regular_pricing");
const Wishlist = require("../../models/wishlist");
const Stores = require("../../models/store");
const StoreProductPricing = require("../../models/store_product_pricing");
var mongoose = require("mongoose");
let csvToJson = require("csvtojson");
const Queues = require("bee-queue");
const queue = new Queues("upload");
const pushController = require("../api/pushController");

exports.upload = (req, res) => {
  let filepath = req.file.path;
  if (!filepath) return res.status(400).send("No files were uploaded.");

  var authorFile = filepath;
  csvToJson()
    .fromFile(authorFile)
    .then(async (jsonObj) => {
      const job = queue.createJob(jsonObj);
      job.retries(3).save();
      job.on("succeeded", (result) => {
        console.log(`Received result for job  ${result}`);
      });
      queue.on("job failed", (jobId, err) => {
        console.log("errrrrrr", err.message + "iddd", jobId);
      });
      job.on("failed", (err) => {
        console.log(`Job ${job.id} failed with error ${err.message}`);
      });
      job.on("retrying", (err) => {
        console.log(
          `Job ${job.id} failed with error ${err.message} but is being retried!`
        );
      });
      queue.process(3, async (job) => {
        var declare = "products";
        for (var i = 0; i < job.data.length; i++) {
          let brandId = await Brand.findOne({
            brand_id: job.data[i].brand_id,
          }).select("_id");
          let products = {
            name: { english: job.data[i].name },
            sku: job.data[i].sku,
            description: job.data[i].description,
            short_description: job.data[i].short_description,
            brand_id: brandId._id,
            meta_description: job.data[i].meta_description,
            meta_keywords: job.data[i].meta_keywords,
            meta_title: job.data[i].meta_title,
            crv: job.data[i].crv,
          };
          await Product.create(products);
        }
        return declare;
      });
    });
};

exports.cronWishlist = async (req, res) => {
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
      // pushController.firebase(wishlistElem._user, "Deal Price");
    }
  }
  const job = queue.createJob(users);
  job.retries(3).save();
  job.on("succeeded", (result) => {
    console.log(`Received result for job  ${result}`);
  });
  queue.on("job failed", (jobId, err) => {
    console.log("errrrrrr", err.message + "iddd", jobId);
  });
  job.on("failed", (err) => {
    console.log(`Job ${job.id} failed with error ${err.message}`);
  });
  job.on("retrying", (err) => {
    console.log(
      `Job ${job.id} failed with error ${err.message} but is being retried!`
    );
  });

  queue.process(3, async (job) => {
    users.forEach((element) => {
      pushController.firebase(element, "Deal Price");
    });
  });
};
