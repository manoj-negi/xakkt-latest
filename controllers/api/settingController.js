const Setting = require('../../models/setting');
var moment = require('moment');
const { validationResult } = require('express-validator');



exports.add = async(req, res) => { 

				const errors = await validationResult(req);
				if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() });
				}

				try{
					let settingInfo =  { 
						key: req.body.key,
						value: req.body.images, 
						description: req.body.description
						}
				console.log(req.body.images)			
			
				let setting = await Setting.create(settingInfo);
				res.json({status:1, message: "Value added successfully", data: setting});
			
				}catch(err){
					res.status(400).json({data: err.message});
				}				
					
			}; 

exports.list = async(req, res) => {

	res.send('i ma working');
 }