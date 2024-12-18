const User = require("../../models/user");
const Roles = require("../../models/role");
const Device = require("../../models/device");
const Company = require("../../models/company");
const Stores = require("../../models/store");

var randomstring = require("randomstring");
const express = require("express");
const bcrypt = require("bcrypt");
const md5 = require("md5");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
var moment = require("moment");
const { validationResult } = require("express-validator");

var Timezone = require("../../models/timezone");
const app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
// const transporter = require('../../config/transporter-mail');
var moment = require("moment-timezone");
const imageUpload = require("../../helper/imageUpload");

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

(exports.check = function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  res.json(req.body.email);
}),
  (exports.list = async (req, res) => {
    let filter = {
      limit: 10,
      skip: 10,
      search: "",
      sort: "ASC",
      sort: {
        name: "asc",
      },
    };

    try {
      // let list =  await Roles.find({_id:req.session.rolesId,name:'SYSTEM ADMININSTRATOR'}).lean()
      // var cond ;
      // (list)?cond={role_id:{$in: [null, [] ]}}:cond={user_id:req.session.userid}

      let users = await User.find({}).populate("role_id").lean();
      if (!users)
        return res.render("admin/user/list", {
          menu: "users",
          submenu: "list",
          users: "",
          success: await req.consumeFlash("success"),
          failure: await req.consumeFlash("failure"),
        });
      return res.render("admin/user/list", {
        menu: "users",
        submenu: "list",
        users: users,
        success: await req.consumeFlash("success"),
        failure: await req.consumeFlash("failure"),
      });
    } catch (err) {
      res.status(400).json({ status: "false", data: err });
    }
  }),
  (exports.edit = async (req, res) => {
    try {
      var role = await Roles.find({}).lean();
      var stores = await Stores.find({}).sort({ name: 1 }).lean();
      var company = await Company.find({}).lean();
      var TimeZone = moment.tz.names();
      const user = await User.findById(req.params.id, {
        password: false,
        updatedAt: false,
      }).exec();
      console.log;
      return res.render("admin/user/edit", {
        menu: "users",
        submenu: "create",
        status: "success",
        role: role,
        timezone: TimeZone,
        message: "",
        user: user,
        stores: stores,
        company: company,
      });
    } catch (err) {
      console.log(err);
      res.status(400).json({ status: "false", data: err });
    }
  });

exports.create = async (req, res) => {
  try {
    var role = await Roles.find({}).lean();
    var TimeZone = moment.tz.names();
    var company = await Company.find({}).lean();
    var stores = await Stores.find({}).sort({ name: 1 }).lean();

    res.render("admin/user/create", {
      menu: "users",
      submenu: "create",
      timezone: TimeZone,
      company: company,
      role: role,
      stores: stores,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ data: err.message });
  }
};
exports.save = async (req, res) => {
  try {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // profile_pic: req.file.path.replace('public/', ''),
    let userinfo = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      password: req.body.password,
      role_id: req.body.role,
      _store: req.body.store,
      contact_no: req.body.contact_no,
      status: req.body.status,
      _supervisor: req.session.userid,
      last_login: req.body.last_login,
      _company: req.body.company,
      ncrStatus: req.body.ncrStatus,
      superbuckId: req.body.superbuckId,
      _timezone: req.body.timezone,
      profile_pic: req.file.filename,
      dob: moment(req.body.dob).format("YYYY-MM-DD"),
    };

    let user = await User.create(userinfo);
    const folder = "users/";
    await imageUpload.uploadNew(req, folder);

    if (user) {
      await req.flash("success", "User added successfully!");
      res.redirect("/admin/users");
    }
  } catch (err) {
    await req.flash("failure", err.message);
    res.redirect("/admin/users");
  }
};

exports.update = async function (req, res) {
  try {
    let userinfo = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      role_id: req.body.role,
      _store: req.body.store,
      contact_no: req.body.contact_no,
      status: req.body.status,
      _supervisor: req.session.userid,
      last_login: req.body.last_login,
      ncrStatus: req.body.ncrStatus,
      _company: req.body.company,
      superbuckId: req.body.superbuckId,
      _timezone: req.body.timezone,
      dob: moment(req.body.dob).format("YYYY-MM-DD"),
    };

    if (req.file) {
      userinfo.profile_pic = req.file.filename;
      //   userinfo.profile_pic = req.file.path.replace(/public/g, "");
      const folder = "users/";
      await imageUpload.uploadNew(req, folder);
    }
    if (req.body.password.trim()) {
      userinfo.password = md5(req.body.password);
    }
    const user = await User.findByIdAndUpdate(
      { _id: req.params.id },
      userinfo,
      { new: true, upsert: true }
    );

    if (!user) {
      await req.flash("success", "User not found.");
      res.redirect("/admin/users");
    }

    await req.flash("success", "User added successfully!");
    res.redirect("/admin/users");
  } catch (err) {
    res.status(400).json({ status: false, message: "Not updated", data: err });
  }
};

exports.updateStatus = async function (req, res) {
  try {
    const user = await User.findByIdAndUpdate(
      { _id: req.query.userid },
      { status: req.query.status },
      { new: true, upsert: true }
    );

    if (!user) {
      res.json({ status: false, message: "Status not updated" });
    }

    res.json({ status: true, message: "Status updated" });
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
    console.log("--userinfo", userInfo);
    if (!userInfo)
      return res
        .status(400)
        .json({ message: "User does not exist with this email." });
    if (md5(req.body.password) !== userInfo.password)
      return res
        .status(400)
        .json({ status: false, message: "Invalid password!!!", data: null });
    let login = await Device.findOne({ _user: userInfo._id }).exec();
    if (login) console.log("--login", login);
    else console.log("--notttt", not);
    const token = await jwt.sign({ id: userInfo._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    return res.json({
      status: true,
      message: "user found!!!",
      data: { user: userInfo, token: token },
    });
  } catch (err) {
    res.status(400).json({ status: false, message: "", data: err });
  }
}),
  (exports.updatestatus = async (req, res) => {
    try {
      const user = await User.updateOne(
        { _id: req.params.userid },
        { rider_status: req.params.status }
      );
      if (user.nModified) {
        res.json({ status: true, message: "Status updated" });
      } else {
        res.json({ status: false, message: "Not found" });
      }
    } catch (err) {
      res
        .status(400)
        .json({ status: false, message: "Not updated", data: err });
    }
  }),
  (exports.delete = (req, res) => {
    User.deleteOne({ _id: req.params.userid }, async (err) => {
      if (err) return res.status(400).json({ data: err });
      await req.flash("success", "User deleted!");
      return res.redirect("/admin/users");
    });
  });
exports.adminlist = async (req, res) => {
  try {
    let users = await User.find({ role_id: { $nin: [[], null] } })
      .populate("role_id")
      .lean();
    if (!users)
      return res.render("admin/admin/list", {
        menu: "users",
        submenu: "list",
        users: "",
        success: await req.consumeFlash("success"),
        failure: await req.consumeFlash("failure"),
      });
    return res.render("admin/admin/list", {
      menu: "users",
      submenu: "adminlist",
      users: users,
      success: await req.consumeFlash("success"),
      failure: await req.consumeFlash("failure"),
    });
  } catch (err) {
    res.status(400).json({ status: "false", data: err });
  }
};
exports.checkEmail = async (req, res) => {
  try {
    let email = await User.findOne({ email: req.body.email }).lean();
    if (email) return res.send({ status: false });
    return res.send({ status: true });
  } catch (err) {
    res.send(err);
  }
};
