const Store = require('../../models/store');
// const Message = require('../../models/message');
var moment = require('moment');
const { validationResult } = require('express-validator');


exports.list = async (req, res)=>{
	
	  try{
			let store = await Store.find().select('-time_schedule').populate('_department','name description no_of_stores').populate('_currency','name').exec();
			if(!store.length) return res.json({status:0, message: "No data found", data: store});
			return res.json({status:1, message: "", data: store});
			
	   }catch(err){
           console.log(err)
			res.status(400).json({status: "success", message: "", data: err});
	   }
},

exports.show =  async (req, res)=> { 
	try{
		const stores = await Store.findById(req.params.id).populate('_currency','name').exec();
		res.json({status: 1, message: "", data: stores});
	 }catch(err){
		res.status(400).json({status: 0, data: err});
   }
	
	
},
exports.create = async(req, res) => { 

				const errors = await validationResult(req);
				if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() });
				}

				try{
					const storeinfo =  { 
                            _department: req.body._department,
                            _user: req._user,
                            contact_no: req.body.contact_no,
                            address: req.body.address,
                            city: req.body.city,
                            state: req.body.state,
                            _country: req.body._country,
                            zipcode: req.body.zipcode,
                            location: { type: "Point", coordinates: [req.body.long, req.body.lat] },
                            time_schedule: {
                                 Monday : { startTime: req.body.schedule.monday_stime, endTime: req.body.schedule.monday_etime },
                                 Tuesday : { startTime: req.body.schedule.tuesday_stime, endTime: req.body.schedule.tuesday_etime },
                                 Wednesday : { startTime: req.body.schedule.wed_stime, endTime: req.body.schedule.wed_etime },
                                 Thursday : { startTime: req.body.schedule.thurs_stime, endTime: req.body.schedule.thurs_etime },
                                 Friday : { startTime: req.body.schedule.fri_stime, endTime: req.body.schedule.fri_etime },
                                 Saturday : { startTime: req.body.schedule.sat_stime, endTime: req.body.schedule.sat_etime },
                                 Sunday : { startTime: req.body.schedule.sun_stime, endTime: req.body.schedule.sun_etime },
                            
                            }
                            
						}
						
				
				let store = await Store.create(storeinfo);
				res.json({status: 1, message: "Store added successfully", data: store});
			
				}catch(err){
                    console.log(err)
					res.status(400).json({data: err.message});
				}				
					
			}; 
exports.addLocation = async(req,res) => {
	var storeLocationInfo = {
		_store: req.body._store,
		address: req.body.address,
		city: req.body.city,
		state: req.body.state,
		_country: req.body._country,
		zipcode: req.body.zipcode, 
		location: { type: "Point", coordinates: [req.body.long, req.body.lat] },
		contact_no: req.body.contact_no,
		time_schedule: req.body.time_schedule
	} 
}
exports.nearByStores = async(req, res) =>{

	const errors = await validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

	Store.find({ location :  { $near :	{ $geometry :  
				{ type : "Point", coordinates : [req.body.long,req.body.lat]  }, $maxDistance:10000 	}  } 
		},'name address city _currency location' ).populate('_currency','name').then( stores => {
			
		   			if(!stores.length) return res.status(400).json({status:false, message: "No store found nearby"});
					return res.json({status:1, message: "", data:stores}); 
								
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
		const store =  await Store.findByIdAndUpdate({ _id: req.params.id }, storeinfo,{ new: true,	upsert: true});
			if(store)return res.json({status:1, message: "Store updated", data:store});
			return res.status(400).json({status:0, message: "Store not found"});
			
		} catch(err){ console.log(err)
			res.status(400).json({status:0, message: "Not updated", data:err});
		}
	

}

exports.deleteStore = async(req,res)=>{
	Store.deleteOne({ _id: req.params.id }, function (err) {
		if (err) return res.status(400).json({data:err});
		 return res.json({status:1, message: "Store Deleted", data:[]});
	  });
}

exports.getStoreByZipcode = async(req, res)=>{
	try{
		let stores = await Store.find({zipcode:req.params.zipcode}).populate('_currency','name').lean();
		if(!stores.length) return res.json({message: "Not store found"});
		return res.json({status:1, message: "", data:stores});
	}catch(err){
		res.status(400).json({data:err});
	}
}
exports.userLocation = async (req, res) => {
	try {
		let cordinates = 	{
	    username: "Skeletor",
		text: "Hello World",
		location: {
		 type: "Point",
		 coordinates: [28.984463, 77.706413]
		}}
	await Message.create(cordinates)
		  
		return res.json({status:1, message: "success", data:''});

	} catch (err) {
		res.status(400).json({ data: err });
	}
}


exports.userNearbyStore = async (req, res) => {
	try {
		let latt = 28.984463
		let long = 77.706413


	let response = await Store.find({
			location: {
			 $near: {
			  $maxDistance: 1000,
			  $geometry: {
			   type: "Point",
			   coordinates: [req.body.lat,req.body.long]
			  }
			 }
			}
		   }).populate('_currency','name').lean()
		if(response) return res.json({status:1, message: "success", data:response});
		return res.json({status:0, message: "failed", data:''});

	} catch (err) {
		res.status(400).json({ data: err });
	}
}

