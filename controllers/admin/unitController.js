const Unit = require('../../models/unit');
const { validationResult } = require('express-validator');

exports.listing = async (req, res)=>{
	
	  try{
			let unit = await Unit.find().exec();
			if(!unit.length) return res.render('admin/unit/listing',{ menu:"units", submenu:"list", unit:"",success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure')  })
			return res.render('admin/unit/listing',{ menu:"units", submenu:"list", unit:unit,success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure')  })
			
	   }catch(err){
			res.status(400).json({status: "success", message: "Department added successfully", data: err});
	   }
},

exports.create = async (req, res)=>{
	try{
		res.render('admin/unit/create', { menu:"units", submenu:"create" })
	}catch(err){
		res.status(400).json({status: "false", data: err});
	}
},

exports.edit =  async (req, res)=> { 
	try{
		const unit = await Unit.findById(req.params.id).exec();
		 res.render('admin/unit/edit',{status: "success", message: "", unit: unit,menu:"unit", submenu:"edit"})
	 }catch(err){
		res.status(400).json({status: "false", data: err});
   }
	
	
},
exports.save = async(req, res) => { 
    
				const errors = await validationResult(req);
				if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() });
				}
				try{
					const unitinfo =  { 
							name: req.body.name,
							description: req.body.description, 
						}
				let unit = await Unit.create(unitinfo);
				if(!unit) return res.json({message:"Soemthing went wrong",data:""})
				await req.flash('success', 'Unit added successfully!');
				res.redirect('/admin/unit')
				
				}catch(err){
					await req.flash('failure', err.message);
					res.redirect('/admin/unit')
					//  res.status(400).json({data: err.message});
				}				
			}; 

exports.update = async function(req, res){

	try{
		const errors = await validationResult(req);
				if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() });
				}
		 
		const unitinfo =  { 
					name: req.body.name,
					description: req.body.description, 
				}		
		 

		const unit =  await Unit.findByIdAndUpdate({ _id: req.params.id }, unitinfo,{ new: true,	upsert: true});
			if(unit)
			{
				await req.flash('success', 'Unit updated successfully!');
				 res.redirect('/admin/unit')
			}
			return res.status(400).json({status:false, message: "Unit not found"});

		} catch(err){ console.log(err)
			await req.flash('failure', err.message);
			res.redirect('/admin/unit')
			// res.status(400).json({status:false, message: "Not updated", data:err});
		}
	

}

exports.delete = async(req,res)=>{
	Unit.deleteOne({ _id: req.params.id }, function (err) {
		if (err) return res.status(400).json({data:err});
		 req.flash('success', 'Unit deleted successfully!');
		res.redirect('/admin/unit')
		//  return res.json({status:true, message: "Department Deleted", data:[]});
	  });
}



