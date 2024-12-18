const Company = require('../../models/company');
const Store = require('../../models/store');

const { validationResult } = require('express-validator');


exports.create = async (req, res) => {
    try {
        const store =  await Store.find().sort({'name': 1}).lean()
        res.render('admin/company/create', { menu: "company",store:store, submenu: "create" })
    } catch (err) {
        res.status(400).json({ status: "false", data: err });
    }
}
exports.save = async (req, res) => {
    try {
        const compinfo = {
            name: req.body.name,
            address: req.body.address,
            contact: req.body.contact,
            email: req.body.email,
            description: req.body.description,
            _store:req.body.store

        }
        const company = await Company.create(compinfo)
        if (!company) return res.json({ status: false, message: "Data not saved" })
        req.flash('success', 'Company added successfully!');
        res.redirect('/admin/company/list')
        // return res.json({ status: true, data: company })
    } catch (err) {
        console.log("errr",err)
        return res.status(404).json({ status: false, message: err })

    }
}
exports.list = async (req, res) => {
    try {
        const company = await Company.find().lean()
        if (!company) return res.render('admin/company/listing', { menu: "company", submenu: "list", data: "",success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure')  })
        return res.render('admin/company/listing', { menu: "company", submenu: "list",data: company,success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure')  })
    } catch (err) {
        res.status(400).json({ status: "false", data: err });

    }

}
exports.delete =  (req,res) =>{
    Company.deleteOne({ _id: req.params.id }, function (err) {
        if (err) return res.status(400).json({ data: err });
        req.flash('success', 'Company deleted successfully!');
        res.redirect('/admin/company/list')
    });  

}
exports.edit = async (req,res) =>{
    try {
        const stores =  await Store.find().lean()
        const company = await Company.findById(req.params.id).sort({'name': 1}).exec();
        res.render('admin/company/edit', { status:true, stores:stores,data:company, menu: "company", submenu: "create" })
    } catch (err) {
        res.status(400).json({ status: "false", data: err });
    }
}
exports.update = async(req,res) =>{
    try {
        const compinfo = {
            address: req.body.address,
            contact: req.body.contact,
            description: req.body.description,
            _store:req.body.store
        }
        const company = await Company.findOneAndUpdate({_id:req.params.id},compinfo,{returnOriginal: false}).lean()
        if(!company) return res.render('admin/company/listing',{menu:"company",submenu:"list" ,success: await req.consumeFlash('success'),data:"", failure: await req.consumeFlash('failure') })
         return  res.redirect('/admin/company/list')

        //  return res.render('admin/company/listing', { status:true, data:company, menu: "company", submenu: "create",success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure')  })
    } catch (err) {
        console.log("---logs",err)
        res.status(400).json({ status: "false", data: err });
    }
}
exports.checkEmail = async(req,res) =>{
    try {
        console.log("--req",req.body)
        let email =  await Company.findOne({email:req.body.email}).lean()
        if(email)return res.send({ status: false })
        return res.send({status:true})
        
    } catch (err) {
        res.send(err)
    }
}