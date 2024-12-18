
var multer  =   require('multer')

var storage =   multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, './public/profile');
    },
    filename: function (req, file, callback) {
      callback(null, Date.now() + '-' + file.originalname.replace(/ /g,'').toLowerCase());
    }
  });

  var imgstorage =   multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, './public/rideimage');
    },
    filename: function (req, file, callback) {
      callback(null, Date.now() + '-' + file.originalname.replace(/ /g,'').toLowerCase());
    }
  });

  exports.upload = multer({ storage : storage}).single('profile_pic');
  exports.ridepic = multer({ storage : imgstorage}).single('image');