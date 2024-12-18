

const fs = require('fs')
const StreamArray = require('stream-json/streamers/StreamArray');
const jsonStream = StreamArray.withParser();
const Department = require('../../models/department')

jsonStream.on('data', async({key, value}) => {
    let departmentInfo ={
                    "name" :value.name, "description" :value.description,
                    "logo":value.logo
                }
                module.exports.documents.push(departmentInfo)
})
jsonStream.on('end', () => {
    console.log('All done');
});
fs.createReadStream('./database_dump/stores.json').pipe(jsonStream.input);



module.exports =
{
    'model': 'Department',
    'documents':[]
}
