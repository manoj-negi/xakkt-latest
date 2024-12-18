// console.log('in db config');
// const mongoose = require('mongoose');
// mongoose.connect(process.env.MONGO_URL, {useUnifiedTopology: true})
// mongoose.Promise = global.Promise;
// module.exports = mongoose;

console.log('in db config');
require('dotenv').config(); // Add this line to load environment variables
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL, { useUnifiedTopology: true })
  .then(() => console.log('Database connected successfully'))
  .catch((err) => console.error('Database connection error:', err));

mongoose.Promise = global.Promise;

module.exports = mongoose;
