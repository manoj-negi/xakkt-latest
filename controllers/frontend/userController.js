const User = require('../../models/user');
var randomstring = require("randomstring");
const express = require('express');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
var moment = require('moment');
const {
	validationResult
} = require('express-validator');
const Device = require('../../models/device')
var md5 = require('md5');
const transporter = require('../../config/transporter-mail');
var fs = require('fs');

const app = express();
var server = require('http').Server(app);
const ejs = require("ejs");
const path = require('path')


exports.addAddress = async (req, res) => {

	try {

		const errors = await validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				errors: errors.array()
			});
		}

		var address_array = [];
		address_array.push({
			address1: req.body.address1,
			address2: req.body.address2,
			city: req.body.city,
			address_type: req.body.address_type,
			countrycode: req.body.countrycode,
			country: req.body.country,
			area: req.body.area,
			phoneno: req.body.phoneno,
			zipcode: req.body.zipcode,
			
			//location: { type: "Point", coordinates: [req.body.long, req.body.lat] },
		})
		
		let user = await User.findOneAndUpdate({
			_id: req.session.userid
		}, {
			$push: {
				address: address_array
			}
		}, {
			returnOriginal: false
		}).exec()
		if (user.address.length == 1) {
			await User.updateOne({
				_id: req.session.userid,
				"address._id": user.address[0]._id
			}, {
				$set: {
					"address.$.is_default": true
				}
			})
		}
		if (!user) return res.json({
			status: 1,
			message: "Data not found"
		})
		return res.json({status:1, message:"Address addedd"})
		//res.redirect(req.header('Referer'));

	} catch (err) {
		console.log("--log", err)
		return res.status(404).json({
			message: err.message
		})
	}
}
exports.addresslist = async (req, res) => {

	try {

		if (req.query.default) {

			var defaultAddress = await User.findOne({
				_id: req.decoded.id
			}, {
				address: {
					$elemMatch: {
						is_default: req.query.default
					}
				}
			}).lean()
			if (!defaultAddress.address) {
				return res.json({
					status: 0,
					message: "No default address added for you"
				})
			}
			return res.json({
				data: defaultAddress
			})
		}

		let user = await User.findOne({
			_id: req.decoded.id
		}, "contact_no email first_name last_name address").select('-_id').lean()
		// let user = await User.findOne({ _id: req.decoded.id }).select('-_id -password -role_id -coupons -last_login -updatedAt -createdAt -ncrStatus').lean()

		if (!user) return res.json({
			status: 0,
			message: "Data not found"
		})
		return res.json({
			state: 1,
			data: user
		})


	} catch (err) {
		console.log("--err", err)
		return res.status(404).json({
			message: err.message
		})

	}

}
exports.deleteAddress = async (req, res) => {

	try {
		let user = await User.findOneAndUpdate({
			_id: req.session.userid
		}, {
			$pull: {
				address: {
					_id: req.params.address
				}
			}
		}, {
			new: true
		}).lean()
		if (!user) return res.json({
			status: 0,
			message: "Data not found"
		})
		res.redirect(req.header('Referer'));


	} catch (err) {
		return res.status(404).json({
			message: err.message
		})

	}
}
exports.makeDefaultAddress = async (req, res) => {
		try {
			let resetDefault = await User.update({
				_id: req.session.userid,
				//address: { $elemMatch: { is_default: true} }
			}, {
				$set: {
					"address.$[].is_default": false
				}
			})

			if (!resetDefault.nModified) return res.json({
				state: 0,
				message: "Could not updated"
			})

			let setDefault = await User.update({
				_id: req.session.userid,
				"address._id": req.params.address
			}, {
				$set: {
					"address.$.is_default": true
				}
			})

			setDefault.nModified && res.redirect(req.header('Referer'));
			return res.json({
				state: 1,
				message: "Something went wrong"
			})

		} catch (err) {
			return res.status(404).json({
				message: err.message
			})

		}
	},
exports.updateAddress = async (req, res) => {
		try {

			let user = await User.findOneAndUpdate({
					'address._id': req.params.id
				}, {
					$set: {
						"address.$.address": req.body.address,
						"address.$.city": req.body.city,
						"address.$.name": req.body.name,
						"address.$.mobile": req.body.mobile,
						"address.$.country": req.body.country,
						"address.$.countrycode": req.body.countrycode,
						"address.$.pincode": req.body.pincode,
						"address.$.state": req.body.state,
						"address.$.region": req.body.region,
						"address.$.location": {
							coordinates: [req.body.long, req.body.lat]
						}
					}
				},
				// { $push: { address: address_array } }, 
				{
					returnOriginal: false
				}).exec()
			if (!user) return res.json({
				status: 1,
				message: "Data not found"
			})
			return res.json({
				status: 1,
				data: user
			})

		} catch (err) {
			console.log("--log", err)
			return res.status(404).json({
				message: err.message
			})
		}

	}
exports.editaddress = async (req, res) => {
	try {

		let user = await User.findOne({
			'address._id': req.params.id
		}, 'address').exec()
		let address = await user.address.id(req.params.id);

		if (!address) return res.json({
			status: 0,
			message: "Data not found"
		})
		return res.json({
			status: 1,
			data: address
		})

	} catch (err) {
		console.log("--log", err)
		return res.status(404).json({
			message: err.message
		})
	}

}
exports.editProfile = async (req, res) => {
	try {
		  const user = await User.findOne({
			_id: req.session.userid
		})


		let dob = moment(user.dob).format("YYYY-MM-DD")
		return res.render('frontend/edit-profile', {
			user: user,
			dob:dob
		})
	} catch (err) {
		console.log(err)
		return res.json({
			data: err
		})
	}

}

exports.updateProfile = async (req, res) => {
		try {
			
			backURL=req.header('Referer') || '/';
  
			let user = await User.findOne({
				_id: req.params.id
			})
			/*if (req.body.old_password) {
				if (!req.body.old_password == user.password) {
					return res.json({
						data: "old password is incorrect"
					})
				}
			}*/
			//const pass = await md5(req.body.password)

			const data = {
				   first_name: req.body.first_name,
					last_name: req.body.last_name,
					email: req.body.email,
					contact_no: req.body.contact_no,
					dob: req.body.dob,	
					gender:req.body.gender
			}
			if(req.file){  data.profile_pic = req.file.path.replace(/public/g, "") }

			
			var userInfo = await User.findOneAndUpdate({
				_id: req.params.id
			}, {
				$set: data
			},{new: true})
			
			
			req.session.profilePic = userInfo.profile_pic;
			
			res.redirect('/user/edit-profile/');
			
		} catch (err) {
			console.log(err)
			res.redirect('/user/edit-profile?err=1');
		}

	},

exports.forgotPasswordPage = async (req, res) => {
		try {
			return res.render('frontend/modals/forgot-password')
		} catch (err) {
			res.status(400).json({
				'data': err
			})
		}
	}
exports.forgotPassword = async (req, res) => {
	try {

		const user = await User.findOne({
			email: req.body.email
		});
		if (!user) {
			res.status(400).json({
				status: 0,
				message: "Email not found"
			});
		}
		if (user) {
			var resetPasswordLink =
				`${process.env.BASE_URL}/user/resetpassword`
			const reset = {
				link: resetPasswordLink,
				name: 'Stranger',
				userid: user.id
			};
			const data = await ejs.renderFile(path.join("views/frontend/reset-password-Email-template.ejs"), {
				reset
			});
			const mainOptions = {
				from: `Message from @xakkt.com <donotreply@xakkt.com>`,
				to: req.body.email,
				subject: "xakkt",
				html: data
			};
			transporter.sendMail(mainOptions, (err, info) => {
				if (err) {
					console.log(err);
				} else {
					console.log('Message sent: ' + info.response);
					return res.redirect('/user/login')
				}
			});

		}
	} catch (err) {
		res.status(400).json({
			'data': err
		})
	}
}

exports.emailToResetPasswordPage = async (req, res) => {
	try {
		const userid = req.query.userid
		return res.render('frontend/reset-password', {
			userid: userid
		})
	} catch (err) {
		res.status(400).json({
			'data': err
		})
	}
}
exports.changepassword = async (req, res) => {
	try {
		let user = await User.findOne({
			_id: req.params.id
		}).exec()
		// const password = randomstring.generate({ length: 12, charset: 'alphanumeric' });
		//const encrypted_password = await bcrypt.hashSync(password, saltRounds);
		const encrypted_password = await md5(req.body.password);
		const changePassword = await User.findOneAndUpdate({
			email: user.email
		}, {
			$set: {
				password: encrypted_password,
			}
		})
		if (changePassword) {
			return res.redirect('/user/login')
		} else {
            return res.send("Email not found")
		}
	} catch (err) {
		res.status(400).json({
			'data': err
		})
	}
}