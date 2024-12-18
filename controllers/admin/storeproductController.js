const Storeproduct = require('../../models/storeproduct');
const { validationResult } = require('express-validator');
exports.save = async (req, res) => {

    try {
        const storeproductinfo = {
            product_id:req.body.product,
            store_id : req.body.store,
            user_id :req.body.user,
            price:req.body.price
        }
      let storeproduct =  await Storeproduct.create(storeproductinfo)
      if(storeproduct) return res.json({success:true,storeproduct:storeproduct,message:"Storeproduct Added Successfully"})
        
    } catch (err) {
        return res.json({status:400,message:err.message})
    }
}
exports.delete = async (req,res) =>{
    Storeproduct.deleteOne({_id:req.params.id},function (err) {
        if(err)return res.status(400).json({data:err});
    	 return res.json({status:true, message: "Storeproduct Deleted", storeproduct:[]});
    }) 
}
exports.view = async (req, res) => {
    try {
        const storeproduct = await Storeproduct.findById(req.params.id).exec();
        res.json({status: "success", message: "", storeproduct: storeproduct});
    } catch (err) {
        res.status(400).json({ status: "false", data: err });
    }


}
exports.update = async (req, res) => {

    try {
        const storeproductinfo = {
            product_id:req.body.product,
            store_id : req.body.store,
            user_id :req.body.user,
            price:req.body.price
        }
        const storeproduct = await Storeproduct.findByIdAndUpdate({ _id: req.params.id }, storeproductinfo, { new: true, upsert: true });
      if(storeproduct) return res.json({success:true,storeproduct:storeproduct,message:"Storeproduct Updated Successfully"})
    } catch (err) {
        return res.json({status:400,message:err.message})
    }
}