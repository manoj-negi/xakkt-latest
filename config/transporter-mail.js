const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    auth: {
        user: "imdev4ios",
        pass: "xnearhdsgilergdh"
    }
});

transporter.verify(function(error, success) {
               if (error) {
                    console.log('-------errorrrr',error);
               } else {
                    console.log('Server is ready to take our messages');
               }
            });	
module.exports = transporter;           