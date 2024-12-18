

const fs = require('fs')
const StreamArray = require('stream-json/streamers/StreamArray');
const jsonStream = StreamArray.withParser();

jsonStream.on('data', ({key, value}) => {
    let storeInfo ={
        "name" :value.name, "address" :value.address, "city" : value.city, "state" :value.state,"zipcode"
:value.zip,"contact_no":4555544554, "time_schedule":{
    "Monday": { startTime: value.monday_start, endTime: value.monday_end },
    "Tuesday": { startTime: value.tuesday_start, endTime: value.tuesday_end },
    "Wednesday": { startTime: value.wednesday_start, endTime: value.wednesday_end },
    "Thursday": { startTime: value.thrusday_start, endTime: value.thrusday_end  },
    "Friday": { startTime: value.friday_start, endTime: value.friday_end  },
    "Saturday": { startTime: value.saturday_start, endTime: value.saturday_end  },
    "Sunday": { startTime: value.sunday_start, endTime: value.sunday_end  }
}
    }
    module.exports.documents.push(storeInfo)
});
jsonStream.on('end', () => {
    console.log('All done');
});

fs.createReadStream('./database_dump/malls.json').pipe(jsonStream.input);

module.exports =
{
    'model': 'Store',
    'documents':[]
}
