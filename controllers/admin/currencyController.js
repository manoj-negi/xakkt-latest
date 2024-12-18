const Currency = require('../../models/currency');

exports.save = async (req, res) => {
    try {
        let store = await Currency.create(req.body);
        req.flash('success', 'Currency added successfully!');
		res.redirect('/admin/currency/list')
    } catch (err) {
        console.log("----err",err)
        res.status(400).json({ status: "false", data: err });
    }
}
exports.create = async (req, res) => {
    try {
       return res.render('admin/currency/create', { menu: "currency", submenu: "create", currency: '' })
    } catch (err) {
        res.status(400).json({ status: "false", data: err });
    }
},
exports.list = async (req, res) => {
    try {
        let currency = await Currency.find({}).exec();
       
        if(!currency.length) return res.render('admin/currency/listing', { menu: "currency", submenu: "list", currency: "", success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure') })
        return res.render('admin/currency/listing', { menu: "currency", submenu: "list", currency: currency, success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure') })
      
    } catch (err) {
        res.status(400).json({ status: "false", data: err });
    }
}
exports.delete = async (req, res) => {
    await Currency.deleteOne({ _id: req.params.id }, function (err) {
		if (err) {
			return res.status(400).json({ data: err });
		}
        req.flash('success', 'Currency deleted successfully!');
		res.redirect('/admin/currency/list')
	});
}
exports.edit = async (req, res) => {
    let currency = await Currency.findOne({ _id: req.params.id }).lean();
    return res.render('admin/currency/edit', { menu: "currency", submenu: "list", currency: currency, success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure') })

    return res.json({ status: true, currency: currency })
}
exports.update = async (req, res) => {
    try{
        const currency = await Currency.findByIdAndUpdate({ _id: req.params.id }, req.body, { new: true, upsert: true });
        if (currency) {
            await req.flash('success', 'currency updated successfully!');
            res.redirect('/admin/currency/list')
        }
        return res.status(400).json({ status: false, message: "currency not found" });
    }catch(err)
    {
        console.log('------',err)

    }

}