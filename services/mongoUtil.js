var MongoClient = require('mongodb').MongoClient;

var db;

var connectDB = callback => {
  var url = 'mongodb://localhost:27017/petcommunityapp';
  console.log('- connecting to database');
  MongoClient.connect(
    url,
    (err, _db) => {
      db = _db;
      return callback(err);
    }
  );
};

var getDB = () => db;
var disconnectDB = () => db.disconnectDB();

module.exports = { connectDB, getDB, disconnectDB };
