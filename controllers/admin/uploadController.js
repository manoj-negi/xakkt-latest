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


if (!queue.processing) {
  queue.processing = true;
  queue.process(3, async (job) => {
      var declare = "products";
      try {
          for (var i = 0; i < job.data.length; i++) {
              let brandId = await Brand.findOne({ brand_id: job.data[i].brand_id }).select("_id");
              if (!brandId) continue; // Skip if brand not found
              let products = {
                  name: { english: job.data[i].name },
                  sku: job.data[i].sku,
                  description: job.data[i].description,
                  short_description: job.data[i].short_description,
                  brand_id: brandId._id,
                  weight: job.data[i].weight,
                  meta_description: job.data[i].meta_description,
                  meta_keywords: job.data[i].meta_keywords,
                  meta_title: job.data[i].meta_title,
                  crv: job.data[i].crv,
              };
              await Product.create(products);
          }
          console.log("Queue processing completed successfully.");
          await queue.destroy(); // Clears the queue after all jobs are processed
          return declare;
      } catch (error) {
          console.error("Error during processing:", error.message);
      }
  });
}

// Upload handler
exports.upload = async (req, res) => {
  console.log("File upload initiated...");
  try {
      let filepath = req.file.path;
      if (!filepath) return res.status(400).send("No files were uploaded.");

      var jsonObj = await csvToJson().fromFile(filepath);
      const job = queue.createJob(jsonObj);
      job.retries(3).save();

      job.on("succeeded", (result) => {
          console.log(`Job succeeded with result: ${result}`);
          res.status(200).send({ status: true, message: "Products uploaded successfully!" });
      });

      job.on("failed", (err) => {
          console.error(`Job failed with error: ${err.message}`);
          res.status(500).send({ status: false, message: "Product upload failed." });
      });

      job.on("retrying", (err) => {
          console.log(`Job retrying due to error: ${err.message}`);
      });
  } catch (error) {
      console.error("CSV Parsing Error:", error.message);
      res.status(500).send({ status: false, message: "Error parsing CSV file." });
  }
};

// exports.upload = (req, res) => {

//   console.log("dhgjasgdfkjagsjdfgjsgdjsgdjfgsdjfgsjdfh")
//   let filepath = req.file.path;
//   if (!filepath) return res.status(400).send("No files were uploaded.");

//   var authorFile = filepath;
//   csvToJson()
//     .fromFile(authorFile)
//     .then(async (jsonObj) => {
//       const job = queue.createJob(jsonObj);
//       job.retries(3).save();
//       job.on("succeeded", (result) => {
//         console.log(`Received result for job  ${result}`);
//       });
//       queue.on("job failed", (jobId, err) => {
//         console.log("errrrrrr", err.message + "iddd", jobId);
//       });
//       job.on("failed", (err) => {
//         console.log(`Job ${job.id} failed with error ${err.message}`);
//       });
//       job.on("retrying", (err) => {
//         console.log(
//           `Job ${job.id} failed with error ${err.message} but is being retried!`
//         );
//       });
//       queue.process(3, async (job) => {
//         var declare = "products";
//         for (var i = 0; i < job.data.length; i++) {
//           let brandId = await Brand.findOne({
//             brand_id: job.data[i].brand_id,
//           }).select("_id");
//           let products = {
//             name: { english: job.data[i].name },
//             sku: job.data[i].sku,
//             description: job.data[i].description,
//             short_description: job.data[i].short_description,
//             brand_id: brandId._id,
//             meta_description: job.data[i].meta_description,
//             meta_keywords: job.data[i].meta_keywords,
//             meta_title: job.data[i].meta_title,
//             crv: job.data[i].crv,
//           };
//           await Product.create(products);
//         }
//         await queue.destroy();
//         return declare;
//       });
//     });
// };

// exports.cronWishlist = async (req, res) => {
//   try {
//       let wishlist = await Wishlist.find().lean();
//       let users = [];

//       for (const wishlistElem of wishlist) {
//           const productStorePriceData = await StoreProductPricing.findOne({
//               _product: wishlistElem._product,
//               _store: wishlistElem._store,
//           });
//           const productRegularPriceData = await ProductRegularPricing.findOne({
//               _product: wishlistElem._product,
//               _store: wishlistElem._store,
//           });

//           const productRegularPrice = productRegularPriceData ? productRegularPriceData.regular_price : 0;
//           const storeDealPrice = productStorePriceData ? productStorePriceData.deal_price : 0;

//           if (wishlistElem.wish_price <= storeDealPrice || wishlistElem.wish_price <= productRegularPrice) {
//               users.push(wishlistElem._user);
//           }
//       }

//       if (users.length === 0) {
//           return res.status(200).send({ status: true, message: "No users met the criteria." });
//       }

//       const job = queue.createJob(users);
//       job.retries(3).save();

//       job.on("succeeded", (result) => console.log(`Job succeeded: ${result}`));
//       job.on("failed", (err) => console.error(`Job failed: ${err.message}`));

//       if (!queue.processing) {
//           queue.processing = true;
//           queue.process(3, async (job, done) => {
//               try {
//                   for (const user of job.data) {
//                       await pushController.firebase(user, "Deal Price");
//                   }
//                   done();
//               } catch (error) {
//                   done(error);
//               }
//           });
//       }

//       return res.status(200).send({ status: true, message: "Wishlist cron job queued successfully." });
//   } catch (error) {
//       if (!res.headersSent) {
//           return res.status(500).send({ status: false, message: "Internal Server Error." });
//       }
//   }
// };


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

//   queue.process(3, async (job) => {
//     users.forEach((element) => {
//       pushController.firebase(element, "Deal Price");
//     });
//   });

// if (!queue.processCalled) {
//     queue.processCalled = true;
//     queue.process(3, async (job) => {
//         try {
//             job.data.forEach((element) => {
//                 pushController.firebase(element, "Deal Price");
//             });
//             await queue.destroy(); // Stops the queue permanently
//             console.log('Queue has been destroyed after processing.');
//         } catch (err) {
//             console.error(`Job processing error: ${err.message}`);
//         }
//     });
// }

};


