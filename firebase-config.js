var admin = require("firebase-admin");

// var serviceAccount =  require("./xakkt-grocery.json");
// var key = 'AAAA0r_CIVo:APA91bEnbhrsj9726TmWMcupZ4KSSetg5pDF2LoXy2j0bnGjYA7-bejiWvkH-WddDxAllgauhJ6_Jm8H-SIal0kcEvkuw-E2yIxyItInHQNAf0PqRFOodjc1kMAjRVNoM9tN3DhpCILS'
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "https://xakkt-grocery-387b2-default-rtdb.firebaseio.com"
//   });
var serviceAccount = require("./xakkt-3981c-firebase-adminsdk-rns9z-1e6b61e13c.json");
var key =
  "AAAA0Rm2KJQ:APA91bGpxp-z96Kl1BZFy5PGvPFXJk5qQSpM_55gocC9EfGDljJmRD-tbFZUc27MidFHk0zyVJyWp0MVipLyZwUfH3eKneIFaGLS01hccwH59WeuNsRG1aO3RYck0Vyu8LghbhWvUXz7";
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://xakkt-3981c-default-rtdb.firebaseio.com",
});

module.exports = admin;
