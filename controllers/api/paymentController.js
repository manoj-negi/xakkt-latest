const Order = require("../../models/order");
const _global = require("../../helper/common");
var moment = require("moment");

exports.payment = async (req, res) => {
  try {
    var date = moment().format("YYYY-MM-DD HH:mm:ss");
    var order = await Order.findOne({ _id: req.body.orderid }).lean();
    if (!order) return res.json({ message: "No Order found", data: "" });
    var amount = 0;
    await Promise.all(
      order.products.map(async (element) => {
        var price = await _global.productprice(order._store, element._product);
        amount += price.regular_price * element.quantity;
      })
    );
    if (amount) {
      order.payment.method == "Cash on deliver"
        ? await Order.findByIdAndUpdate(
            order._id,
            {
              $set: {
                "shipping.tracking.status": "delivered",
                "payment.transaction_id": "",
                "payment.payment_date": date,
              },
            },
            { new: true }
          ).lean()
        : await Order.findByIdAndUpdate(
            order._id,
            {
              $set: {
                "shipping.tracking.status": "dispatched",
                "payment.transaction_id": "Done",
                "payment.payment_date": date,
              },
            },
            { new: true }
          ).lean();
      await pushController.firebase(req.decoded.id, "Payment Done");
      return res.json({
        status: "success",
        total_price: amount,
        order_id: order.shipping.order_id,
        date: date,
        message: "Payment Done",
      });
    }
    await pushController.firebase(req.decoded.id, "Payment Failed");
    return res.json({ message: "Payment Failed" });
  } catch (err) {
    console.log("---er", err);
    return res.status(400).json({ data: err.message });
  }
};
