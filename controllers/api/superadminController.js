const User = require('../../models/user');
const Roles = require('../../models/role')
const Timezone = require('../../models/timezone')
var moment = require('moment');

exports.create = async (req, res) => {

    try {
        let role = await Roles.findOne({ key: req.body.key }).exec()
        // 
        console.log("---role",role)
        if (!role) return res.json({ message: "Role not found" })
        const superadmininfo = {
            first_name: 'Admin',
            last_name: 'Admin',
            email: req.body.email,
            password: req.body.password,
            role_id: role._id,
            contact_no: 99999999,
            dob: moment('Mon 03-Jul-2020, 11:00 AM').format('YYYY-MM-DD')
        }
        const user = await User.create(superadmininfo)
        if (!user) return res.json({ message: "Data not inserted" })
        return res.json({ status: 1, message: "User Created.", data: user });

    } catch (err) {
        console.log("----err", err)
        return res.json({ status: 0, error: err })
    }
}