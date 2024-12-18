const express = require("express");
const logger = require("morgan");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const mongoose = require("./config/database");
const path = require("path");
var { flash } = require("express-flash-message");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./config/swagger.json");
var session = require("express-session");
const PORT = process.env.PORT || 4000;
const app = express();
let ejs = require("ejs");
var cors = require("cors");
var server = require("http").Server(app);
var io = require("socket.io")(server);
app.use(cors());
var moment = require("moment");
var isloggedin = require("./middlewares/isloggedin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// var userloggedin = require('./middlewares/customerloggedin')
//var moment = require('moment-timezone');
//moment().tz("America/Los_Angeles").format('ha z');
//moment.tz.setDefault("America/New_York");
var sess = {
  resave: true,
  secret: "keyboard cat",
  saveUninitialized: true,
  cookie: { maxAge: 3600000000 },
};
/*if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = true // serve secure cookies
}*/

app.use(session(sess));
app.use(cookieParser());

app.use(function (req, res, next) {
  res.locals.user = req.session.customer;
  res.locals.profilePic = req.session.profilePic;
  next();
});

app.use(flash({ sessionKeyName: "xakktFlashMessages" }));
const adminRoute = require("./routes/admin");
const frontendRoute = require("./routes/frontend");
const mobileApi = require("./routes/api");
app.use(bodyParser.urlencoded({ extended: true }));
// connection to mongodb
mongoose.connection.on(
  "error",
  console.error.bind(console, "MongoDB connection error:")
);
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use("/api-docs", swaggerUi.serve);

function unique(arr) {
  var hash = {},
    result = [];
  for (var i = 0, l = arr.length; i < l; ++i) {
    if (!hash.hasOwnProperty(arr[i])) {
      hash[arr[i]] = true;
      result.push(arr[i]);
    }
  }
  return result;
}

app.get("/filter", function (req, res) {
  MongoClient.connect("mongodb://localhost:27017/", function (err, db) {
    if (err) {
      console.log("not getting connected", err);
      throw err;
    }
    var dbo = db.db("xakkt-latest");
    dbo
      .collection("productcategories")
      .find({})
      .forEach(async function (doc) {
        dbo
          .collection("productcategories")
          .update(
            { _id: doc._id },
            { $set: { _products: unique(doc._products) } }
          );
      });
  });

  res.json({ data: "abc" });
});

app.get("/api-docs", swaggerUi.setup(swaggerDocument));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
let ejsOptions = {
  // delimiter: '?', Adding this to tell you do NOT use this like I've seen in other docs, does not work for Express 4
  async: true,
};

// The engine is using a callback method for async rendering
app.engine("ejs", async (path, data, cb) => {
  try {
    let html = await ejs.renderFile(path, data, ejsOptions);
    cb(null, html);
  } catch (e) {
    cb(e, "");
  }
});
app.locals.moment = require("moment");

io.on("connection", function (socket) {
  socket.on("disconnect", function () {});

  socket.on("trackrider", function (data) {
    io.emit("ridingpoints", data);
  });
});

//  app.get('/',(req, res)=> {
//        return  res.render('frontend/index')
//   })
//   app.get('/about',(req, res)=> {
//     return  res.render('frontend/about')
// })
// app.get('/contact',(req, res)=> {
//   return  res.render('frontend/contact')
// })

app.use("/admin", isloggedin, adminRoute);
app.use("/", frontendRoute);
app.use("/api/v1", mobileApi);

server.listen(PORT, () => console.log(`Listening on ${PORT}`));
