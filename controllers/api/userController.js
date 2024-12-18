const User = require("../../models/user");
var randomstring = require("randomstring");
const express = require("express");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
var moment = require("moment");
const { validationResult } = require("express-validator");
const Device = require("../../models/device");
var md5 = require("md5");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

const transporter = require("../../config/transporter-mail");

class Mail {
  constructor(info) {
    this.email = info.email;
    this.subject = "Xakkt New Password";
    this.body = `Here's your autogenerrated password <b>${info.password}</b>  . It is recommonded to change password after using it.`;
  }
  async sendmail() {
    let info = await transporter.sendMail({
      from: `Message from @xakkt.com <donotreply@xakkt.com>`, // sender address
      to: this.email, // list of receivers
      subject: this.subject, // Subject line
      html: `${this.body}`,
    });

    return info;
  }
}

/*exports.check = function (req, res) {

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ errors: errors.array() });
	}
	res.json(req.body.email);
},*/

(exports.list = function (req, res) {
  // let query = User.find({}, { password: false, updatedAt: false }).exec();
  let query = User.find({}, ["first_name", "last_name", "email", "dob"]).exec();
  query
    .then(function (result) {
      res.json({ status: 1, users: result });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json({ status: 0, data: err });
    });
}),
  (exports.getUser = async (req, res) => {
    try {
      const user = await User.findById(req.params.id, {
        password: false,
        updatedAt: false,
      }).exec();
      res.json({ status: 1, message: "", data: user });
    } catch (err) {
      res.status(400).json({ status: 0, data: err });
    }
  });

exports.create = async (req, res) => {
  try {
    const errors = await validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customer = await stripe.customers.create({
      email: req.body.email,
      description: "Xakkt Customer",
    });

    let userinfo = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      password: req.body.password,
      contact_no: req.body.contact_no,
      status: req.body.status,
      last_login: req.body.last_login,
      ncrStatus: req.body.ncrStatus,
      superbuckId: req.body.superbuckId,
      timezone: req.body.timezone,
      stripe_customer_id: customer.id,
      dob: moment(req.body.dob, "DD-MM-YYYY").format("YYYY-MM-DD"),
    };

    User.create(userinfo, function (err, result) {
      if (err) return res.json({ status: 0, data: { message: err.message } });
      //mail.sendmail();
      return res.json({ status: 1, message: "User Created.", data: result });
    });
  } catch (err) {
    res.status(400).json({ data: err });
  }
};

exports.updateProfile = async function (req, res) {
  try {
    let userinfo = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      contact_no: req.body.contact_no,
      password: await md5(req.body.password),
      status: req.body.status,
      last_login: req.body.last_login,
      ncrStatus: req.body.ncrStatus,
      superbuckId: req.body.superbuckId,
      timezone: req.body.timezone,
      dob: moment(req.body.dob, "DD-MM-YYYY").format("YYYY-MM-DD"),
    };

    if (req.file) {
      userinfo.profile_pic = req.file.path.replace("public/", "");
    }
    const user = await User.findByIdAndUpdate(
      { _id: req.params.id },
      userinfo,
      { new: true, upsert: true }
    );

    if (!user)
      return res.status(400).json({ status: 0, message: "User not found" });

    res.json({ status: 1, message: "User updated", data: { user: user } });
  } catch (err) {
    res.status(400).json({ status: false, message: "Not updated", data: err });
  }
};

(exports.authenticate = async (req, res) => {
  try {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const userInfo = await User.findOne({ email: req.body.email }).exec();
    if (!userInfo)
      return res
        .status(400)
        .json({ message: "User does not exist with this email." });

    if (md5(req.body.password) !== userInfo.password)
      return res
        .status(400)
        .json({ status: 0, message: "Invalid password!!!", data: null });
    /*const deviceinfo = {
			user_id: userInfo._id,
			device_type: req.body.device_type,
			device_token: req.body.device_token
		}*/
    Device.findOneAndUpdate(
      { user_id: userInfo._id, device_token: req.body.device_token },
      {
        device_token: req.body.device_token,
        device_type: req.body.device_type,
      },
      { upsert: true },
      function (err, result) {
        if (err) {
          return res.status(400).json({ message: err.message });
        }
      }
    );
    const token = await jwt.sign(
      { id: userInfo._id, customer_id: userInfo.stripe_customer_id },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );
    return res.json({
      status: 1,
      message: "user found!!!",
      data: { user: userInfo, token: token },
    });
  } catch (err) {
    console.log("--err", err);
    res.status(400).json({ status: 0, message: "", data: err });
  }
}),
  (exports.updatestatus = async (req, res) => {
    try {
      const user = await User.updateOne(
        { _id: req.params.userid },
        { rider_status: req.params.status }
      );
      if (user.nModified) {
        res.json({ status: 1, message: "Status updated" });
      } else {
        res.json({ status: 0, message: "Not found" });
      }
    } catch (err) {
      res.status(400).json({ status: 0, message: "Not updated", data: err });
    }
  }),
  (exports.forgotPassword = async (req, res) => {
    try {
      const password = randomstring.generate({
        length: 12,
        charset: "alphanumeric",
      });
      const info = { email: req.body.email, password: password };
      mail = new Mail(info);
      //const encrypted_password = await bcrypt.hashSync(password, saltRounds);
      const encrypted_password = await md5(password);
      const user = await User.updateOne(
        { email: req.body.email },
        { password: encrypted_password }
      );

      if (user.nModified) {
        if (mail.sendmail()) {
          res.status(200).json({
            status: 1,
            data: "Auto-generated password is sent to your email.",
          });
        } else {
          res.status(400).json({ data: "Unable to send mail" });
        }
      } else {
        res.status(400).json({ status: 0, message: "Email not found" });
      }
    } catch (err) {
      res.status(400).json({ data: err });
    }
  }),
  (exports.changePassword = async (req, res) => {
    try {
      const encrypted_password = await md5(req.body.password);

      const query = User.findOne({ email: req.body.email }).exec();
      const userInfo = await query.then();
      console.log(encrypted_password);

      if (userInfo != null && md5(req.body.oldpassword) == userInfo.password) {
        const query = User.updateOne(
          { email: req.body.email },
          { password: encrypted_password }
        ).exec();
        query.then(function (result) {
          res
            .status(200)
            .json({ status: 1, message: "Pasword updated", data: result });
        });
      } else {
        res.status(400).json({
          status: 0,
          message: "Invalid email/password!!!",
          data: null,
        });
      }
    } catch (err) {
      console.log(err);
      res.status(400).json({ status: 0, message: "not updated", data: err });
    }
  });

exports.address = async (req, res) => {
  try {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    var address_array = [];
    address_array.push({
      address1: req.body.address1Line,
      address2: req.body.address2,
      city: req.body.city,
      address_type: req.body.address_type,
      countrycode: req.body.countrycode,
      country: req.body.country,
      region: req.body.region,
      contactno: req.body.contactno,
      zipcode: req.body.zipcode,
      emirate: req.body.emirate,
      name: req.body.name,
      location: { type: "Point", coordinates: [req.body.long, req.body.lat] },
    });
    console.log("0--00000", address_array);

    let user = await User.findOneAndUpdate(
      { _id: req.decoded.id },
      { $push: { address: address_array } },
      { returnOriginal: false }
    ).exec();
    if (user.address.length == 1) {
      await User.update(
        {
          _id: req.decoded.id,
          "address._id": user.address[0]._id,
        },
        { $set: { "address.$.is_default": true } }
      );
    }
    if (!user) return res.json({ status: 1, message: "Data not found" });
    return res.json({ status: 1, message: "Data saved successfully" });
  } catch (err) {
    console.log("--log", err);
    return res.status(404).json({ message: err.message });
  }
};
exports.addresslist = async (req, res) => {
  try {
    if (req.query.default) {
      var defaultAddress = await User.findOne(
        { _id: req.decoded.id },
        { address: { $elemMatch: { is_default: req.query.default } } }
      ).lean();
      if (!defaultAddress.address) {
        return res.json({
          status: 0,
          message: "No default address added for you",
        });
      }
      return res.json({ data: defaultAddress });
    }

    let user = await User.findOne(
      { _id: req.decoded.id },
      "contact_no email first_name last_name address"
    )
      .select("-_id")
      .lean();
    // let user = await User.findOne({ _id: req.decoded.id }).select('-_id -password -role_id -coupons -last_login -updatedAt -createdAt -ncrStatus').lean()

    if (!user) return res.json({ status: 0, message: "Data not found" });
    return res.json({ state: 1, data: user });
  } catch (err) {
    console.log("--err", err);
    return res.status(404).json({ message: err.message });
  }
};
exports.deleteaddress = async (req, res) => {
  try {
    let user = await User.findOneAndUpdate(
      { _id: req.decoded.id },
      { $pull: { address: { _id: req.params.id } } },
      { new: true }
    ).lean();
    if (!user) return res.json({ status: 0, message: "Data not found" });
    return res.json({ state: 1, message: "Address deleted successfully" });
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
};
(exports.makeDefaultAddress = async (req, res) => {
  try {
    let resetDefault = await User.update(
      {
        _id: req.decoded.id,
        //address: { $elemMatch: { is_default: true} }
      },
      { $set: { "address.$[].is_default": false } }
    );

    if (!resetDefault.nModified)
      return res.json({ state: 0, message: "Could not updated" });

    let setDefault = await User.update(
      {
        _id: req.decoded.id,
        "address._id": req.body._address,
      },
      { $set: { "address.$.is_default": true } }
    );

    if (setDefault.nModified)
      return res.json({ state: 1, message: "Default address selected" });
    return res.json({ state: 1, message: "Something went wrong" });
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
}),
  (exports.updateaddress = async (req, res) => {
    try {
      // var address_array = [];
      // const address_value = {
      // 	address: req.body.address,
      // 	city: req.body.city,
      // 	address_type: req.body.address_type,
      // 	country: req.body.country,
      // 	region: req.body.region,
      // 	pincode: req.body.pincode,
      // 	state: req.body.state,
      // 	location: { type: "Point", coordinates: [req.body.long, req.body.lat] },
      // }
      let user = await User.findOneAndUpdate(
        { "address._id": req.params.id },
        {
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
              coordinates: [req.body.long, req.body.lat],
            },
          },
        },
        // { $push: { address: address_array } },
        { returnOriginal: false }
      ).exec();
      if (!user) return res.json({ status: 1, message: "Data not found" });
      return res.json({ status: 1, data: user });
    } catch (err) {
      console.log("--log", err);
      return res.status(404).json({ message: err.message });
    }
  });
exports.editaddress = async (req, res) => {
  try {
    let user = await User.findOne({ "address._id": req.params.id }).exec();
    if (!user) return res.json({ status: 1, message: "Data not found" });
    return res.json({ status: 1, data: user });
  } catch (err) {
    console.log("--log", err);
    return res.status(404).json({ message: err.message });
  }
};
