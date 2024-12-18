const Role = require('../../models/role');
const User = require('../../models/user');
const md5 = require("md5")
var moment = require('moment-timezone');

const { validationResult } = require('express-validator');

// exports.login = async (req, res) => {
//     try {
//         const errors = await validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({ errors: errors.array() });
//         }
//         const userInfo = await User.findOne({ email: req.body.email }).populate({path:'role_id', select:'key'}).lean()

//         console.log("userrr====================",userInfo.paswword)

//         console.log("usersssss==============",md5(req.body.password))
       
//         if (!userInfo) { await req.flash('failure', "Email is not valid"); return res.redirect('/admin/login') };
//         if (md5(req.body.password) !== userInfo.password) {
//             await req.flash('failure', "Invalid password!!!");
//             res.redirect('/admin/login');
//         }
//         await User.findOneAndUpdate({ email: req.body.email }, { last_login: Date.now() }).lean()
        
//         var date = moment.tz.setDefault(userInfo._timezone)
//         // console.log("--utc", utc._timezone.abbr)
//         // var date = moment.tz.setDefault(utc._timezone.abbr);
//         req.session.date = date,
//         req.session.company = userInfo._company;
//         req.session.email = userInfo.email;
//         req.session.userid = userInfo._id;
//         req.session.roles = userInfo.role_id.map(obj => obj.key );
//         req.session.rolesId = userInfo.role_id.map( obj => obj._id );  

//         return res.redirect('/admin')
//     } catch (err) {
//         console.log('err ====>>', err)
//         await req.flash('failure', "Please enter valid email and password");
//         return res.redirect('/admin/login');

//     }
// }


exports.login = async (req, res) => {
    try {
        const errors = await validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userInfo = await User.findOne({ email: req.body.email })
            .populate({ path: 'role_id', select: 'key' })
            .lean();

        if (!userInfo) {
            await req.flash('failure', "Email is not valid");
            return res.redirect('/admin/login'); 
        }

        if (md5(req.body.password) !== userInfo.password) {
            await req.flash('failure', "Invalid password!!!");
            return res.redirect('/admin/login'); 
        }

        await User.findOneAndUpdate(
            { email: req.body.email },
            { last_login: Date.now() }
        ).lean();

        const date = moment.tz.setDefault(userInfo._timezone);
        req.session.date = date;
        req.session.company = userInfo._company;
        req.session.email = userInfo.email;
        req.session.userid = userInfo._id;
        req.session.roles = userInfo.role_id.map(obj => obj.key);
        req.session.rolesId = userInfo.role_id.map(obj => obj._id);

        return res.redirect('/admin');
    } catch (err) {
        console.log('err ====>>', err);
        await req.flash('failure', "Please enter a valid email and password");
        return res.redirect('/admin/login'); 
    }
};

exports.create = async (req, res) => {
    try {
        console.log("========")
        let role = await Role.find({}).lean()
        // res.render('admin/user/list', { menu: "users", submenu: "list", users: users, success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure') })
        res.render('admin/auth/login', { success: await req.consumeFlash('success'), failure: await req.consumeFlash('failure'), role: role })
    } catch (err) {
        res.status(400).json({ status: "false", data: err });
    }
}
exports.logout = async (req, res) => {
    if (req.session) {
        req.session.destroy(function (err) {
            if (err) {
                return next(err);
            } else {
                req.session = null;
                console.log("logout successful");
                return res.redirect('/admin/login');
            }
        });
    }
}