const User = require('../../models/user');
const Roles = require('../../models/role')
const Device = require('../../models/device')
const Company = require('../../models/company')
const Stores = require('../../models/store')

var randomstring = require("randomstring");
const express = require('express');
const bcrypt = require('bcrypt');
const md5 = require("md5")
const saltRounds = 10;
const jwt = require('jsonwebtoken');
var moment = require('moment');
const { validationResult } = require('express-validator');

var Timezone = require('../../models/timezone')
const app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
//const transporter = require('../../config/transporter-mail');
var moment = require('moment-timezone');


exports.assignCompanies = async (req, res) => {
    try {
        let roleId = await Roles.findOne({key:"field_rep"}).lean()
        let fieldReps = await User.find({ role_id: { $elemMatch: { $eq:roleId._id }} }).select('first_name last_name email contact_no').lean();
        res.render('admin/fieldrep/fieldrep_company', { menu: "fieldrep", submenu: "add_companies", fieldReps:fieldReps })
    } catch (err) {
        console.log(err)
        res.status(400).json({ data: err.message });
    }
}
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
            _store:req.body.store,
            contact_no: req.body.contact_no,
            status: req.body.status,
            _supervisor: req.session.userid,
            last_login: req.body.last_login,
            _company:req.body.company,
            ncrStatus: req.body.ncrStatus,
            superbuckId: req.body.superbuckId,
            _timezone: req.body.timezone,
            profile_pic: req.file.path.replace(/public/g, ""),
            dob: moment(req.body.dob).format('YYYY-MM-DD')
        }

        let user = await User.create(userinfo)

        if (user) {
            await req.flash('success', 'User added successfully!');
            res.redirect('/admin/users')
        }
    } catch (err) {
        await req.flash('failure', err.message);
        res.redirect('/admin/users')
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
            dob: moment(req.body.dob).format('YYYY-MM-DD')
        }

        if (req.file) { userinfo.profile_pic = req.file.path.replace(/public/g, ""); }
        if (req.body.password.trim()) { userinfo.password = req.body.password }
        const user = await User.findByIdAndUpdate({ _id: req.params.id }, userinfo, { new: true, upsert: true });

        if (!user) {
            await req.flash('success', 'User not found.');
            res.redirect('/admin/users')
        }

        await req.flash('success', 'User added successfully!');
        res.redirect('/admin/users')


    } catch (err) {
        res.status(400).json({ status: false, message: "Not updated", data: err });
    }


}

exports.updateStatus = async function (req, res) {

    try { 
        
        const user = await User.findByIdAndUpdate({ _id: req.query.userid }, {status:req.query.status}, { new: true, upsert: true });

        if (!user) {
            res.json({ status: false, message: "Status not updated" });
        }

        res.json({ status: true, message: "Status updated" });


    } catch (err) {
        res.status(400).json({ status: false, message: "Not updated", data: err });
    }


}

exports.authenticate = async (req, res) => {

    try {
      
        const errors = await validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const userInfo = await User.findOne({ email: req.body.email }).exec();
        
        if (!userInfo) return res.status(400).json({ message: "User does not exist with this email." });
        if (md5(req.body.password) !== userInfo.password) return res.status(400).json({ status: false, message: "Invalid password!!!", data: null });
        let login = await Device.findOne({ _user: userInfo._id }).exec()
        if (login) console.log("--login", login)
        else console.log("--notttt", not)
        const token = await jwt.sign({ id: userInfo._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        return res.json({ status: true, message: "user found!!!", data: { user: userInfo, token: token } });

    } catch (err) {
        res.status(400).json({ status: false, message: "", data: err });
    }

}





