const admin = require("../../firebase-config");
var FCM = require("fcm-push");
const User = require("../../models/user");
const Device = require("../../models/device");

exports.firebase = async (req, message) => {
  try {
    var registrationToken = []; //req.body.registrationToken;
    const device = await Device.find({
      user: req.decoded.id,
      device_type: "ios",
    });
    for (const deviceElem of device) {
      registrationToken.push(deviceElem.device_token);
    }

    var payload = {
      registration_ids: registrationToken,
      notification: {
        sound: "default",
        title: message,
        body: message,
      },
    };
    try {
      let sender = new FCM(process.env.FCM_KEY);
      console.log("pushMessage->>>>>", payload);
      sender.send(payload, (err, result) => {
        sender = null;
        payload = null;
        if (err) {
          console.log("error in sending push>>>", err);
        } else {
          console.log("sending push done>>>", result);
        }
      });
    } catch (err) {
      console.log("ERROR IN PUSH", err);
      // resolve({ error: err });
    }
  } catch (err) {
    console.log("errr", err);
  }
};
