const Department = require('../../models/department');
const Order = require('../../models/order');

const { validationResult } = require('express-validator');
var moment = require('moment-timezone');


exports.listing = async (req, res) => {

    try {
        if (req.query.length) {
            var pagno = req.query.start / req.query.length + 1
            var page = parseInt(req.query.draw) || 1; //for next page pass 1 here
            var limit = parseInt(req.query.length) || 5;
            let searchString = req.query.search.value || ''
            let order = await Order.find({}).populate('_store','name address contact_no').populate('_user','first_name last_name address')
                .skip((pagno - 1) * limit) //Notice here
                .limit(limit)
                .lean();
                // coupon_code: { $regex: '.*' + searchString + '.*', $options: 'i' }
            let total = await Order.find({}).count()
            console.log("--order",order)
            return res.json({ draw: page, recordsTotal: total, recordsFiltered: total, data: order })

        }
        else {
            return res.render('admin/order/listing', { menu: "orders", submenu: "list", success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure') })
        }


    } catch (err) {
        console.log("--err", err)
        res.status(400).json({ data: err.message });
    }
}
exports.edit = async (req, res) => {
    let order = await Order.findOne({ _id: req.params.id }).populate('_user').lean();
    return res.json({ status: true, data: order })
}
exports.update = async (req, res) => {
    try{
        await Order.findOneAndUpdate({ _id: req.params.id },
        { $set:{
            'shipping.tracking.status':req.body.status
        }
        }).lean();
        return res.json({status:true})
    }catch(err)
    {        
        return res.json({status:false})
    }

}

exports.orderDelete = async(req, res) => {
    
    try{
        Order.deleteOne({ _id: req.params.id }, function (err) {
            if (err) return res.status(400).json({ data: err });
            return res.json({status:1, message:"Deleted"})
        });
    }catch(err)
    {    
           return res.json({status:0, message:"Something Went Wrong."})

    }
}