const Roles = require('../models/role')
const User = require('../models/user')
const Permission = require('../models/permission');
const { check } = require('../controllers/admin/userController');


module.exports = async (req, res, next)=>{
    console.log("======")
    if (req.url == '/login') return next();
    if (req.session.email) { 
        
        res.locals.user = req.session.userid
        res.locals.rolesId = req.session.rolesId

        res.locals.check = async (...value) => {
               const role = await User.findOne({_id:req.session.userid}).populate({
                path: 'role_id',
                model: 'Role',
                match: {
                  key:{$eq:'customer'}
                }
            }).exec()
            if(role.role_id.length) return true
            const permission = await Permission.findOne({ name: value,_roles:{$in:req.session.rolesId}}).exec()
            if(!permission) return false
            return true
           }
        next()
    }
    else {
        console.log("========daata")
        // return res.render('/admin/')
    }
};


