const fs = require('fs')
const StreamArray = require('stream-json/streamers/StreamArray');
const jsonStream = StreamArray.withParser();
const Brand = require('../../models/brand')
let newArr = []
jsonStream.on('data', async ({ key, value }) => {
    try {
        let brandId = await Brand.findOne({ brand_id: value.brand_id }).select('_id')
        let products = {
            "name": { "english": value.name }, "sku": value.sku, "cuisine":value.cuisine,"description": value.description, "short_description": value.short_description
            , "brand_id": value._id, "meta_description": value.meta_description, "meta_keywords": value.meta_keywords,
            "meta_title": value.meta_title, "crv": value.crv
        }
        newArr.push(products)
    } catch (err) {
        console.log(err)
    }

})
jsonStream.on('end', () => {
    console.log('All done');
});

fs.createReadStream('./database_dump/products.json').pipe(jsonStream.input)

module.exports =
{
    'model': 'Product',
    'documents': newArr
}

