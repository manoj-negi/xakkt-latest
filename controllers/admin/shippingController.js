
const { validationResult } = require('express-validator');
var moment = require('moment-timezone');

exports.listing = async (req, res) => {
    try {
        if (req.query.length) {
            var pagno = req.query.start / req.query.length + 1
            var page = parseInt(req.query.draw) || 1; //for next page pass 1 here
            var limit = parseInt(req.query.length) || 5;
            let searchString = req.query.search.value || ''

            // let payment = await Payment.find({

            //     // coupon_code: { $regex: '.*' + searchString + '.*', $options: 'i' }
            // }).populate('_store')
            //     .skip((pagno - 1) * limit) //Notice here
            //     .limit(limit)
            //     .lean();
            // let total = await Payment.find(
            //     {
            //         // coupon_code: { $regex: '.*' + searchString + '.*', $options: 'i' }
            //     }
            // ).lean()
            // console.log("--total",total)
            // console.log("--order",payment)
            // return res.json({ draw: page, recordsTotal: total.length, recordsFiltered: total.length, data: payment })

        }
        else {
            return res.render('admin/shipping/listing', { menu: "payment", submenu: "list", success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure') })
        }


    } catch (err) {
        console.log("--err", err)
        res.status(400).json({ data: err.message });
    }
}
exports.list = async (req, res) => {
    try {
        if (req.query.length) {
            var pagno = req.query.start / req.query.length + 1
            var page = parseInt(req.query.draw) || 1; //for next page pass 1 here
            var limit = parseInt(req.query.length) || 5;
            let searchString = req.query.search.value || ''

            // let payment = await Payment.find({

            //     // coupon_code: { $regex: '.*' + searchString + '.*', $options: 'i' }
            // }).populate('_store')
            //     .skip((pagno - 1) * limit) //Notice here
            //     .limit(limit)
            //     .lean();
            // let total = await Payment.find(
            //     {
            //         // coupon_code: { $regex: '.*' + searchString + '.*', $options: 'i' }
            //     }
            // ).lean()
            // console.log("--total",total)
            // console.log("--order",payment)
            // return res.json({ draw: page, recordsTotal: total.length, recordsFiltered: total.length, data: payment })

        }
        else {
            return res.render('admin/shipping/zoneListing', { menu: "payment", submenu: "list", success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure') })
        }


    } catch (err) {
        console.log("--err", err)
        res.status(400).json({ data: err.message });
    }
}