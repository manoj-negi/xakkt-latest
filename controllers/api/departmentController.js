const Department = require('../../models/department');
const store = require('../../models/store');
var moment = require('moment');
const { validationResult } = require('express-validator');


exports.list = async (req, res)=>{
	
	  try{
			let department = await Department.find().exec();
			if(!department.length) return res.json({status: 0, message: "No data found", data: department});
			return res.json({status:1, message: "", data: department});
			
	   }catch(err){
		    console.log(err)
			res.status(400).json({status:1, message: "", data: err});
	   }
},

exports.show =  async (req, res)=> { 
	try{
		const departments = await Department.findById(req.params.id).exec();
		res.json({status:1, message: "", data: departments});
	 }catch(err){
		res.status(400).json({status:0, data: err});
    }
	
	
},
exports.create = async(req, res) => { 

				const errors = await validationResult(req);
				if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() });
				}

				try{
					const storeinfo =  { 
							name: req.body.name,
							description: req.body.description, 
							contact_no: req.body.contact_no,
							_user: req.decoded.id,
							no_of_stores: req.body.no_of_stores,
							logo: req.body.logo,
							status:req.body.status, 
						}
						
				
				let department = await Department.create(storeinfo);
				res.json({status:1, message: "Department added successfully", data: department});
			
				}catch(err){
					res.status(400).json({data: err.message});
				}				
					
			}; 

exports.nearByStores = async(req, res) =>{

	const errors = await validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

	Department.find({ location :  { $near :	{ $geometry :  
				{ type : "Point", coordinates : [req.body.long,req.body.lat]  }, $maxDistance:10000 	}  } 
		} ).then( departments => {
			
		   			if(!departments.length) return res.status(400).json({status:false, message: "No department found nearby"});
					return res.json({status:1, message: "", data:departments}); 
								
		}).catch( err => {
			res.status(400).json({status:0, message:err});
  		})

}
	
exports.updateStore = async function(req, res){

	try{
		const errors = await validationResult(req);
				if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() });
				}

		let storeinfo =  { 
			name: req.body.name,
			description: req.body.description, 
			contact_no: req.body.contact_no,
			zipcode: req.body.zipcode, 
			location: { type: "Point", coordinates: [req.body.long, req.body.lat] },
			status:req.body.status, 
		}

		//if(req.file){ userinfo.profile_pic=req.file.path.replace('public/',''); }
		const department =  await Department.findByIdAndUpdate({ _id: req.params.id }, storeinfo,{ new: true,	upsert: true});
			if(department)return res.json({status:1, message: "Department updated", data:department});
			return res.status(400).json({status:0, message: "Department not found"});
			
		} catch(err){ console.log(err)
			res.status(400).json({status:0, message: "Not updated", data:err});
		}
}

exports.getStoreByZipcode = async(req, res)=>{
	try{
		let departments = await Department.find({zipcode:req.params.zipcode}).lean();
		if(!departments.length) return res.json({message: "Not department found"});
		return res.json({status:1, message: "", data:departments});
	}catch(err){
		res.status(400).json({data:err});
	}
}

