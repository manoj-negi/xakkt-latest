const Deal = require('../../models/deal');
const Store = require('../../models/store');

const { validationResult } = require('express-validator');

exports.create = async (req, res) => {
    try {
        let stores = await Store.find().exec();
        res.render('admin/deals/create', { menu: "deals", submenu: "create", stores: stores })
    } catch (err) {
        res.status(400).json({ status: "false", data: err });
    }
}
exports.save = async (req, res) => {
    try {
        const errors = await validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const dealinfo = {
            name: req.body.name,
            description: req.body.description,
            _store: req.body.store
        }

        // categoryInfo.parent_id = (req.body.parent_id) ? req.body.parent_id : null;

        const deal = await Deal.create(dealinfo);
        await req.flash('success', 'Deal added successfully!');
        res.redirect('/admin/deal')

    } catch (err) {
        await req.flash('failure', err.message);
        res.redirect('/admin/deal')
        // res.status(400).json({ data: err.message });
    }


}
exports.listing = async (req, res) => {
    try {
        let deal = await Deal.find().limit(5).sort('name').exec();
        if (!deal.length) return res.render('admin/deals/listing', { menu: "deal", submenu: "list", deal: "", success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure') })
        return res.render('admin/deals/listing', { menu: "deal", submenu: "list", deal: '', success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure') })
    } catch (err) {
        res.status(400).json({ data: err.message });
    }
}
exports.delete = async (req, res) => {
    Deal.deleteOne({ _id: req.params.id }, function (err) {
        if (err) return res.status(400).json({ data: err });
        req.flash('success', 'Deal deleted successfully!');
        res.redirect('/admin/deal')
        //  return res.json({status:true, message: "Department Deleted", data:[]});
    });
}
exports.edit = async (req, res) => {
    try {
        let stores = await Store.find().exec();
        const deal = await Deal.findById(req.params.id).exec();
        res.render('admin/deals/edit', { status: "success", message: "", deal: deal, stores: stores, menu: "Deal", submenu: "edit" })
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

        const dealinfo = {
            name: req.body.name,
            description: req.body.description,
            _store: req.body.store
        }
        const deal = await Deal.findByIdAndUpdate({ _id: req.params.id }, dealinfo, { new: true, upsert: true });
        if (deal) {
            await req.flash('success', 'Deal updated successfully!');
            res.redirect('/admin/deal')
        }
        return res.status(400).json({ status: false, message: "Deal not found" });

    } catch (err) {
        console.log(err)
        await req.flash('failure', err.message);
        res.redirect('/admin/deal')
        // res.status(400).json({status:false, message: "Not updated", data:err});
    }


}
exports.list = async function (req, res) {
    try {
        var pagno = req.query.start/req.query.length + 1
        var page = parseInt(req.query.draw) || 1; //for next page pass 1 here
        var limit = parseInt(req.query.length) || 5;
        let deal = await Deal.find()
            .skip((pagno-1) * limit) //Notice here
            .limit(limit)
            .lean();
       let total = await Deal.find().lean()
        // if (!deal.length) return res.render('admin/deals/listing', { menu: "deal", submenu: "list", deal: "", success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure') })
        return res.json({ draw: page,recordsTotal:total.length,recordsFiltered:total.length,data: deal })
    } catch (err) {
        res.status(400).json({ data: err.message });
    }
}