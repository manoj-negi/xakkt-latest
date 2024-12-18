const Store = require('../models/store')
var moment = require('moment-timezone');

exports.store_time = async (_store) => {
    try {
        let time = await Store.findOne({ _id: _store }).exec()
        if(!time) {
            return false;
        }
        var date = moment.tz.setDefault(time._timezone)
        return date
    } catch (err) {
        console.log("--err",err)
      return err
    }
}