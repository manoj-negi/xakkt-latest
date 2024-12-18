
const fs = require('fs')
const StreamArray = require('stream-json/streamers/StreamArray');
const jsonStream = StreamArray.withParser();

jsonStream.on('data', ({key, value}) => {
    try{
    let user = {
        "first_name":value.first_name,"last_name":value.last_name,"profile_pic" : value.photo , "status": value.status,"ncrStatus":value.ncr_status,"superbuckId":value.superbuckid,"dob":'',"address": [{ "address" : value.address, "address_type":'Home' , "pincode" : 45754 , "phoneno": value.mobile_no,"countrycode" :value.country_id , "city":value.city ,"region" :"" , "state" : value.state  , "country" :''
        }] ,"password":value.password ,"contact_no":value.mobile_no, "email":value.email
    }
    module.exports.documents.push(user) 
}catch(err){
    console.log(err)
}
   
})
jsonStream.on('end', () => {
    console.log('All done');
});

fs.createReadStream('./database_dump/users.json').pipe(jsonStream.input)

module.exports =
{
    'model': 'User',
    'documents':[]
}
