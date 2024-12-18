const Wishlist = require('../models/wishlist')
const Device = require('../models/device')
const admin = require('../firebase-config');

const mongoose = require('mongoose');

exports.wishlist = async (_store, product, price) => {
    let filter = {
        _product: product,
        _store: _store,
        wish_price: { $gte: price }
    }
    try {
        var devices_token = []
        let list = await Wishlist.find(filter).exec()
        list.map(async (item) => {
            let devices = await Device.find({ user_id: item._user }).exec()
            devices.map((device) => {
                devices_token.push(device.device_token)
            })
            const options = {
                priority: 'high',
                timeToLive: 60 * 60 * 24, // 1 day
            };
            var payload = {
                notification: {
                    title: 'Testing',
                    body: 'Testing',
                },
                data: {
                    push_type: "1",
                },
                notification: {
                    body: "This is a message from FCM to web",
                    requireInteraction: "true",
                }
                // }
            }
            admin.messaging().sendToDevice(devices_token, payload, options)
                .then(response => {
                    console.log("---respnsonessss", response)
                })
                .catch(error => {
                    console.log(error);
                })

        })
    } catch (err) {
        console.log('error---------', err)
    }


},

exports.pushNotification = async () => {
    try {
        var devices_token = []
            let devices = await Device.find({ user_id: item._user }).exec()
            devices.map((device) => {
                devices_token.push(device.device_token)
            })
            const options = {
                priority: 'high',
                timeToLive: 60 * 60 * 24, // 1 day
            };
            var payload = {
                notification: {
                    title: 'Testing',
                    body: 'Testing',
                },
                data: {
                    push_type: "1",
                },
                notification: {
                    body: "This is a message from FCM to web",
                    requireInteraction: "true",
                }
                // }
            }
            admin.messaging().sendToDevice(devices_token, payload, options)
                .then(response => {
                    console.log("---respnsonessss", response)
                })
                .catch(error => {
                    console.log(error);
                })

    } catch (err) {
        console.log('error---------', err)
    }


}