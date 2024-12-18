const fs = require('fs')
const StreamArray = require('stream-json/streamers/StreamArray');
const jsonStream = StreamArray.withParser();

jsonStream.on('data', ({key, value}) => {
    try{
    let brands = {
        "name":value.name,"brand_id":value.id
    }
    module.exports.documents.push(brands) 
}catch(err){
    console.log(err)
}
   
})
jsonStream.on('end', () => {
    console.log('All done');
});

fs.createReadStream('./database_dump/brands.json').pipe(jsonStream.input)

module.exports =
{
    'model': 'Brand',
    'documents':[]
}
