const RegularPrice = require('../../models/product_regular_pricing');
const Store = require('../../models/store');
const Deal = require('../../models/deal');
const StoreProductPricing = require('../../models/store_product_pricing');
var ObjectId = require('mongoose').Types.ObjectId;
const User = require('../../models/user')
const Product = require('../../models/product')

exports.create = async (req, res) => {
    try {
       
        let product = await Product.findById(req.params.productid).select('name -_id').lean();
        
        if(req.session.roles.includes('system_admin')){
            var stores = await Store.find({}).select('name _currency').populate('_currency').collation({ locale: "en" }).sort({'name': 1}).lean();
            userStores = stores
        }else{
            var stores = await User.findOne({_id:req.session.userid}).select('-_id -password -role_id -coupons -last_login -updatedAt -createdAt -ncrStatus').populate({path:'_store',select:'name _currency',options: { sort: { 'name': 1 } }, populate: {path: '_currency'} }).lean() 
            userStores = stores._store
        }

        var storesIds = userStores.map(store => store._id)
        let regularPrice = await RegularPrice.find({ _store:{$in : storesIds},_product:req.params.productid}).lean()
   
        return res.render('admin/product/regular_price', {
            menu: "RegularPrice",
            regularPrice: regularPrice,
            stores: userStores,
            productid: req.params.productid,
            productName:product.name.english
        })
    } catch (err) {
        res.status(400).json({
            data: err.message
        });
    }
}

exports.addprice = async (req, res) => {
    try { 
        if(req.body.store.length != req.body.regular_price.length){
            return res.json({status:false, message:"Something went wrong"})
        }
        const arr = [];
        for (i = 0; i < req.body.store.length; i++) {
            data = {};
            data.regular_price = parseFloat(req.body.regular_price[i]).toFixed(2);
            data._store = req.body.store[i]
            data._product = req.body.productid
            data._user = req.session.userid
            arr.push(data)
        }
      
        var remove_price = await RegularPrice.deleteMany({_user:data._user, _product:data._product}).exec();
        if (!remove_price) return res.json({ status: false })

        var prices = await RegularPrice.insertMany(arr).then()
        if(!prices){ return res.json({ message:"Something went wrong", status: false })  }
            res.redirect('/admin/product')

    } catch (err) {
        console.log('===validation', err)
     await req.flash('failure', "Regular price");
        res.send(err)
    }
}
exports.remove = async (req, res) => {
    try {
        let data = await RegularPrice.findOne({
            _id: req.body._id
        }).lean()
       return await Promise.all([
            await StoreProductPricing.deleteOne({
                _store: data._store,
                _product: data._product
            }).exec(),
            await RegularPrice.deleteOne({
                _id: req.body._id
            }).exec()
        ]).then(result => {
            return res.json({
                status: true
            })
        }).catch(error => {
            return res.json({status:false})
        });
        await StoreProductPricing.deleteOne({
            _store: data._store,
            _product: data._product
        }).exec()
        //   let remove =  await RegularPrice.deleteOne({_id:req.body._id}).exec()
        //   if(!remove) return res.json({status:false})
        return res.json({
            status: true
        })
    } catch (err) {
        res.send(err)
    }
}
/**
 *  get regular price and details using store id
 * _store_id
 */
exports.get = async (req, res) => {
    try {
        
        let storedata = await Store.findOne({ _id: req.body.storeid }).select('-time_schedule -_department -holidays -__v -createdAt -updatedAt -_user').populate({
			path: '_currency',
			select: 'name',
		 }).lean()
        var regularPrice = await RegularPrice.findOne({
            _product: req.body.productid,
            _store: req.body.storeid
        }).lean({ getters: true });
        if (!regularPrice) return res.json({
            status: false,
            message: "Not found"
        })
        return res.json({
            status: true,
            data: regularPrice,
            store:storedata
           
        })
    } catch (err) {
        res.status(400).json({
            data: err.message
        });
    }
}