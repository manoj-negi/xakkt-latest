const Brand = require('../../models/brand');
const Coupon = require('../../models/coupon');
const Store = require('../../models/store');

const { validationResult } = require('express-validator');

exports.create = async (req, res) => {
    try {
        let store = await Store.find().exec();
        res.render('admin/coupon/create', { menu: "coupon", submenu: "add", store: store })
    } catch (err) {
        res.status(400).json({ status: "false", data: err });
    }
},
exports.save = async (req, res) => {

        try {
            const couponinfo = {
                coupon_code: req.body.coupanname,
                _store: req.body.store,
                apply: req.body.coupan_applied,
                amount: req.body.amount,
                min_amount:req.body.min_amount
            }
            // categoryInfo.parent_id = (req.body.parent_id) ? req.body.parent_id : null;
            const coupon = await Coupon.create(couponinfo);
            if (coupon) await req.flash('success', 'Coupon added successfully!');
            res.redirect('/admin/coupon/list')

        } catch (err) {
            console.log("--err", err)
            await req.flash('failure', err.message);
            res.redirect('/admin/coupon/list')
            // res.status(400).json({ data: err.message });
        }


    }
exports.listing = async (req, res) => {

    try {
        if (req.query.length) {
            var pagno = req.query.start / req.query.length + 1
            var page = parseInt(req.query.draw) || 1; //for next page pass 1 here
            var limit = parseInt(req.query.length) || 5;
            let searchString = req.query.search.value ||''
            let coupon = await Coupon.find({

                coupon_code: { $regex: '.*' + searchString + '.*', $options: 'i' }
            })
                .skip((pagno - 1) * limit) //Notice here
                .limit(limit)
                .lean();
            let total = await Coupon.find(
                {
                    coupon_code: { $regex: '.*' + searchString + '.*', $options: 'i' }
                }
            ).lean()
            return res.json({ draw: page, recordsTotal: total.length, recordsFiltered: total.length, data: coupon })

        }
        else {
            return res.render('admin/coupon/listing', { menu: "coupon", submenu: "list", success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure') })
        }
        // let brand = await Brand.find().exec();
        // if (!brand.length) return res.render('admin/brand/listing', { menu: "brands", submenu: "list", brand: "", success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure') })
        // return res.render('admin/brand/listing', { menu: "brands", submenu: "list", brand: brand, success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure') })


    } catch (err) {
        console.log("--err", err)
        res.status(400).json({ data: err.message });
    }
}
exports.delete = async (req, res) => {
    Coupon.deleteOne({ _id: req.params.id }, function (err) {
        if (err) return res.status(400).json({ data: err });
        req.flash('success', 'Coupon deleted successfully!');
        res.redirect('/admin/coupon/list')
        //  return res.json({status:true, message: "Department Deleted", data:[]});
    });
}
exports.edit = async (req, res) => {
    try {

        let store = await Store.find().exec();
        const coupon = await Coupon.findById(req.params.id).exec();
        res.render('admin/coupon/edit', { status: "success", message: "", data:coupon,store:store, menu: "coupon", submenu: "add" })
        // res.json({status: "success", message: "", data: departments});
    } catch (err) {
        res.status(400).json({ status: "false", data: err });
    }


}
exports.update = async function (req, res) {

    try {
        const errors = await validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const couponinfo = {
            coupon_code: req.body.coupanname,
            _store: req.body.store,
            apply: req.body.coupan_applied,
            amount: req.body.amount,
            min_amount:req.body.min_amount

        }

        const coupon = await Coupon.findByIdAndUpdate({ _id: req.params.id }, couponinfo, { new: true, upsert: true });
        if (coupon) {
            await req.flash('success', 'Coupon updated successfully!');
            res.redirect('/admin/coupon/list')
        }
        return res.status(400).json({ status: false, message: "Coupon not found" });

    } catch (err) {
        console.log(err)
        await req.flash('failure', err.message);
        res.redirect('/admin/coupon/list')
        // res.status(400).json({status:false, message: "Not updated", data:err});
    }


}
