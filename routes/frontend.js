const express = require("express");
const router = express.Router();
var app = express();

const { body } = require("express-validator");
var bodyParser = require("body-parser");
const _global = require("../helper/common");
var isloggedin = require("../middlewares/customerloggedin");
// var userloggedin = require('../middlewares/customerloggedin')
var multer = require("multer");
var moment = require("moment");
const path = require("path");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

var userStorage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./public/images/users");
  },
  filename: function (req, file, callback) {
    const img = path.basename(
      file.originalname,
      path.extname(file.originalname)
    );
    callback(
      null,
      img.split(" ").join("_").toLowerCase() +
        "_" +
        moment().unix() +
        path.extname(file.originalname)
    );
  },
});
var userUpload = multer({ storage: userStorage });

const IndexController = require("../controllers/frontend/indexController");
const AuthController = require("../controllers/frontend/authController");
const StoreController = require("../controllers/frontend/storeController");
const cartController = require("../controllers/frontend/cartController");
const categoryController = require("../controllers/frontend/categoryController");
const orderController = require("../controllers/frontend/orderController");
const shoppingController = require("../controllers/frontend/shoppinglistController");
const wishController = require("../controllers/frontend/wishlistControllers");
const userController = require("../controllers/frontend/userController");

const userValidation = [
  body("email")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("Email should not be empty"),
  body("email").isEmail().withMessage("Should be an email"),
  body("first_name")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("first_name should not be empty"),
  body("contact_no")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("Contact no should not be empty"),
  body("password")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("Password should not be empty"),
  body("dob")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("Date of birth should not be empty"),
];

const userLoginValidation = [
  body("email")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("Email should not be empty"),
  body("email").isEmail().withMessage("Should be an email"),
  body("password")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("Password should not be empty"),
];

const cartValidation = [
  body("_product")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("_product should not be empty"),
  body("_store")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("_store should not be empty"),
  body("quantity")
    .not()
    .isEmpty()
    .withMessage("cart_price should not be empty"),
];

const wishlistValidation = [
  body("_product")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("_product should not be empty"),
  body("_store")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("_store should not be empty"),
];

router.use(function (req, res, next) {
  res.locals.fullName = req.session?.fullName ?? null;
  res.locals.userEmail = req.session?.customer ?? null;
  res.locals.profilePic = req.session?.profilePic ?? null;
  res.locals.userid = req.session?.userid ?? null;
  next();
});
/*-------- validation -------------*/
const addressValidation = [
  body("address1")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("address should not be empty"),
  body("address_type")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("address_type should not be empty"),
  body("emirate")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("state should not be empty"),
  body("country")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("country should not be empty"),
  body("countrycode")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("country code should not be empty"),
  body("lat")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("latitude should not be empty"),
  body("long")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("longitude should not be empty"),
];

router.get("/product/:id", IndexController.list);
router.post("/cookie", IndexController.cookie);
router.get("/cookiees", IndexController.cookiees);

router.get("/user/login", (req, res) => res.render("frontend/login"));
router.get("/user/edit-profile", isloggedin, userController.editProfile);
router.post(
  "/user/update-profile/:id",
  userUpload.single("profile_pic"),
  userController.updateProfile
);
router.post("/user/create", userValidation, AuthController.create);
router.post("/user/login", userLoginValidation, AuthController.login);
router.get("/user/logout", AuthController.logout);
router.post("/user/add-address", userController.addAddress);
router.get("/user/defautl-address/:address", userController.makeDefaultAddress);
router.get("/user/delete-address/:address", userController.deleteAddress);
router.post("/user/update-address", userController.updateAddress);
router.get("/user/get-address/:id", userController.editaddress);
router.get("/user/forgetpassword", userController.forgotPasswordPage);
router.post("/user/resetpassword", userController.forgotPassword);
router.get("/user/resetpassword", userController.emailToResetPasswordPage);
router.post("/user/changepassword/:id", userController.changepassword);

/*------------ User ---------*/
router.get("/", StoreController.homepage);
router.get("/products/:slug", StoreController.products);
router.get("/:store/product/:product", StoreController.productDetails);
router.get("/checkout/:store", isloggedin, cartController.checkoutPage);
router.get("/get/products/quantity:store", cartController.getProductsQuantity);
router.get("/listCards", isloggedin, cartController.listCards);
router.post(
  "/checkout/chargeSavedCard",
  isloggedin,
  cartController.chargeSavedCard
);
router.post("/checkout/delete-card", cartController.deleteCard);
router.post("/checkout/connection_token", cartController.connectionToken);
router.get("/savecard", function (req, res) {
  return res.render("frontend/save-card.ejs");
});

router.get("/public-key", (req, res) => {
  console.log("---public keyu---");
  res.send({ publicKey: process.env.STRIPE_PUBLISH_KEY });
});

router.post("/create-setup-intent", async (req, res) => {
  res.send(await stripe.setupIntents.create());
});

/*------- cart api ----------*/
router.post(
  "/product/add-to-cart",
  cartValidation,
  cartController.addPoductToCart
);
router.post("/product/remove-from-cart", cartController.removeProductFromCart);
router.post("/product/cart-size", cartController.cartSize);
router.post(
  "/cart/update_quantity",
  cartValidation,
  cartController.updateProductQuantity
);
router.post("/cart/empty_cart/:storeid", cartController.makeCartEmpty);
router.post("/cart/checkout", cartController.orderCheckout);
router.post("/cart/savecard", cartController.saveCard);
/*---- shoppinglist ----*/

const updateListValidation = [
  // body('_shoppinglist').not().isEmpty().trim().escape().withMessage('_shoppinglist should not be empty'),
  body("_product")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("_product should not be empty"),
  body("quantity")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("quantity should not be empty"),
];

const shoppinglistValidation = [
  body("_store")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("_store should not be empty"),
  body("name")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("name should not be empty"),
];

const getListValidation = [
  body("_store")
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage("_store should not be empty"),
];

router.post(
  "/shoppinglist/add_product",
  updateListValidation,
  shoppingController.addProductToshoppinglist
);
router.post(
  "/shoppinglists/remove_from_all_list",
  shoppingController.removeFromAllList
);
router.post(
  "/shoppinglist/create",
  isloggedin,
  shoppinglistValidation,
  shoppingController.createShoppingList
);
router.post(
  "/list/shoppinglist",
  getListValidation,
  shoppingController.allShoppingLists
);
router.get(
  "/shoppinglist/remove_product/:shoppinglistid",
  shoppingController.deleteProductFromShoppinglist
);
router.patch(
  "/shoppinglist/product/quantity",
  shoppingController.updateShoppinglist
);
router.post("/shoppinglist/remove/:id", shoppingController.deleteShoppinglist);
router.get(
  "/shoppinglist/:shoplist/products",
  shoppingController.shoppinglistProducts
);
router.get("/wishlist/lists/:product_id", wishController.getListingWish);
router.post(
  "/product/add-to-favlist",
  wishlistValidation,
  wishController.addPoductToWishlist
);
router.post("/wishlist/products", wishController.allWishlistProducts);
router.get(
  "/wishlist/remove/product/:listid",
  wishController.deleteProductWishlist
);
router.put(
  "/wishlist/update/:wishlistid",
  wishController.updateProductWishPrice
);

router.get("/myorders/:store", isloggedin, orderController.myorder);
router.post("/placeorder", orderController.placeOrder);
//router.post('/order/create/:store',orderController.creatOrder)
//router.post('/order/create/:store',orderController.creatOrder)

router.get(
  "/:store/category/products/:category",
  categoryController.categoryProducts
);
router.get(
  "/:store/main-category/products/:category",
  categoryController.productbyParentCategory
);
router.get("/cart", function (req, res) {
  return res.render("frontend/cart");
});
router.get("/payment-success", function (req, res) {
  return res.render("frontend/payment-success");
});
router.get("/payment-error", function (req, res) {
  return res.render("frontend/payment-error");
});
router.post("/products/cart", cartController.cartProducts);

module.exports = router;
