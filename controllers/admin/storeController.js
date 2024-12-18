const Department = require('../../models/department');
const Store = require('../../models/store');
const User = require('../../models/user');
const Country = require('../../models/country')
const Timezone = require('../../models/timezone')
const {
	validationResult
} = require('express-validator');
var moment = require('moment-timezone');
const Currency = require('../../models/currency');
const { ['log']: c } = console;


exports.list = async (req, res) => {

		try {
			var cond = (req.session.roles.includes('system_admin'))?{}:{ _id :{ $in: req.session.stores } }
			let stores = await Store.find(cond).exec();

			return res.render('admin/store/listing', 
				{
					menu: "store",
					submenu: "list",
					stores: stores
				})
			 
		 } catch (err) {
			res.status(400).json({
				status: "success",
				data: err
			});
		}
	},

exports.show = async (req, res) => {
		try {
			const stores = await Store.findById(req.params.id).exec();
			res.json({
				status: "success",
				message: "",
				data: stores
			});
		} catch (err) {
			res.status(400).json({
				status: "false",
				data: err
			});
		}


	},

		exports.create = async (req, res) => {

			try {
				let currency = await Currency.find({}).lean()
				var countries = await Country.find({}).lean();
				var departments = await Department.find({}).lean();
				var timezone = await Timezone.find({}).lean()
				// var TimeZone = moment.tz.countries()
				var TimeZone = moment.tz.names();
				res.render('admin/store/create', {
					menu: "store",
					submenu: "create",
					departments: departments,
					countries: countries,
					timezone: TimeZone,
					currency: currency
				})
			} catch (err) {
				console.log(err)
				res.status(400).json({
					data: err.message
				});
			}

		}
exports.editStore = async (req, res) => {
		try {
			var store = await Store.findById(req.params.storeid).lean();
			var countries = await Country.find({}).lean();
			var departments = await Department.find({}).lean();
			var timezone = await Timezone.find({}).lean()
			var currency = await Currency.find({}).lean()
			var TimeZone = moment.tz.names();
			res.render('admin/store/edit', {
				menu: "store",
				submenu: "",
				store: store,
				departments: departments,
				countries: countries,
				timezone: TimeZone,
				currency: currency
			})
		} catch (err) {

		}
	},
	exports.saveStore = async (req, res) => {

			try {
				
				var holiday_date = req.body.holiday.split('-').map((item) => item.trim())
				const storeinfo = {
					name: req.body.name,
					_department: req.body.department,
					_user: req.session.userid,
					contact_no: req.body.contact_no,
					address: req.body.address,
					city: req.body.city,
					state: req.body.state,
					slug:(req.body.name+req.body.address).replace(/ /g, "-").toLowerCase(),
					_company: req.session.company,
					_country: req.body.country,
					_timezone: req.body.timezone,
					_currency: req.body.currency,
					zipcode: req.body.zipcode,
					contact_no: req.body.contactno,
					location: {
						type: "Point",
						coordinates: [req.body.long, req.body.lat]
					},
					time_schedule: {
						Monday: {
							startTime: req.body.monday_stime,
							endTime: req.body.monday_etime
						},
						Tuesday: {
							startTime: req.body.tuesday_stime,
							endTime: req.body.tuesday_etime
						},
						Wednesday: {
							startTime: req.body.wed_stime,
							endTime: req.body.wed_etime
						},
						Thursday: {
							startTime: req.body.thurs_stime,
							endTime: req.body.thurs_etime
						},
						Friday: {
							startTime: req.body.fri_stime,
							endTime: req.body.fri_etime
						},
						Saturday: {
							startTime: req.body.sat_stime,
							endTime: req.body.sat_etime
						},
						Sunday: {
							startTime: req.body.sun_stime,
							endTime: req.body.sun_etime
						},

					},
					holidays: {
						startDate: holiday_date[0],
						endDate: holiday_date[1],
						message: req.body.holiday_message
					}

				}


				let store = await Store.create(storeinfo);
				res.redirect('/admin/stores')

				// res.json({status: "success", message: "Store added successfully", data: store});

			} catch (err) {
				console.log(err)
				res.status(400).json({
					data: err.message
				});
			}

		},

		exports.addLocation = async (req, res) => {
			var storeLocationInfo = {
				_store: req.body._store,
				address: req.body.address,
				city: req.body.city,
				state: req.body.state,
				_country: req.body._country,
				zipcode: req.body.zipcode,
				location: {
					type: "Point",
					coordinates: [req.body.long, req.body.lat]
				},
				contact_no: req.body.contact_no,
				time_schedule: req.body.time_schedule
			}
		}
exports.nearByStores = async (req, res) => {

	const errors = await validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({
			errors: errors.array()
		});
	}

	Store.find({
		location: {
			$near: {
				$geometry: {
					type: "Point",
					coordinates: [req.body.long, req.body.lat]
				},
				$maxDistance: 10000
			}
		}
	}).then(stores => {

		if (!stores.length) return res.status(400).json({
			status: false,
			message: "No department found nearby"
		});
		return res.json({
			status: true,
			message: "",
			data: stores
		});

	}).catch(err => {
		res.status(400).json({
			status: false,
			message: err
		});
	})

}


exports.updateStore = async function (req, res) {
	
	try {
		const errors = await validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				errors: errors.array()
			});
		}
		//var holiday_date = req.body.holiday.split('-').map((item) => item.trim())
		const storeinfo = {
			name: req.body.name,
			_department: req.body.department,
			_user: req._user,
			contact_no: req.body.contact_no,
			address: req.body.address,
			city: req.body.city,
			state: req.body.state,
			slug:(req.body.name+req.body.address).replace(/ /g, "-").toLowerCase(),
			_country: req.body.country,
			_currency: req.body.currency,
			_timezone: req.body.timezone,
			zipcode: req.body.zipcode,
			contact_no: req.body.contactno,
			location: {
				type: "Point",
				coordinates: [req.body.long, req.body.lat]
			},
			time_schedule: {
				Monday: {
					startTime: req.body.monday_stime,
					endTime: req.body.monday_etime
				},
				Tuesday: {
					startTime: req.body.tuesday_stime,
					endTime: req.body.tuesday_etime
				},
				Wednesday: {
					startTime: req.body.wednesday_stime,
					endTime: req.body.wednesday_etime
				},
				Thursday: {
					startTime: req.body.thursday_stime,
					endTime: req.body.thursday_etime
				},
				Friday: {
					startTime: req.body.friday_stime,
					endTime: req.body.friday_etime
				},
				Saturday: {
					startTime: req.body.saturday_stime,
					endTime: req.body.saturday_etime
				},
				Sunday: {
					startTime: req.body.sunday_stime,
					endTime: req.body.sunday_etime
				},

			},
			/*holidays: {
				startDate: holiday_date[0],
				endDate: holiday_date[1],
				message: req.body.holiday_message
			}*/

		}
		const store = await Store.findByIdAndUpdate({
			_id: req.params.id
		}, storeinfo, {
			new: true,
			upsert: true
		});
		if (store) res.redirect('/admin/stores')
		return res.status(400).json({
			status: false,
			message: "Store not found"
		});

	} catch (err) {
		console.log(err)
		res.status(400).json({
			status: false,
			message: "Not updated",
			data: err
		});
	}


}

exports.deleteStore = async (req, res) => {
	try {
		console.log("----im heee", req.params.id)
		let store = await Store.deleteOne({
			_id: req.params.id
		})
		console.log("---logsss", store)
		if (store) {
			res.redirect('/admin/stores')
		}
	} catch (err) {
		console.log('err',err)
	}
	// 	 function (err) {
	// 	if (err) {
	// 		console.log("--data", err)
	// 		return res.status(400).json({ data: err });
	// 	}
	// 	//  return res.json({status:true, message: "Store Deleted", data:[]});
	// });

}

exports.getStoreByZipcode = async (req, res) => {
	try {
		let stores = await Store.find({
			zipcode: req.params.zipcode
		}).lean();
		if (!stores.length) return res.json({
			message: "Not department found"
		});
		return res.json({
			status: true,
			message: "",
			data: stores
		});
	} catch (err) {
		res.status(400).json({
			data: err
		});
	}
}