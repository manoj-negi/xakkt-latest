const { validationResult } = require('express-validator');

let _this = module.exports = {}

_this.validate = (req, res)=>{
    return new Promise((resolve, reject)=>{

        const errors = validationResult(req);
				if (!errors.isEmpty()) {
					return resolve(res.status(400).json({ errors: errors.array() }));
                }
                resolve();
    
    })
    
}

