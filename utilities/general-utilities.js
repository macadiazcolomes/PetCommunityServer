var express = require('express'),
  config = require('../config'),
  jwt_ex = require('express-jwt'),
  mongoDB = require('../services/mongoUtil');

const server_response = require('../services/response_formats');
var app = (module.exports = express.Router());

//database connection
var db = mongoDB.getDB();
var ObjectID = require('mongodb').ObjectID;

//PROTECTED ROUTES
var jwtCheck = jwt_ex({
  secret: config.secret,
});
app.use('/pca/protected', jwtCheck);

//general vars
var collections = [];
collections.users = db.collection('users');
collections.pets = db.collection('pets');
collections.alerts = db.collection('alerts');
collections.services = db.collection('services');
collections.sos = db.collection('sos');
collections.messages = db.collection('messages');

function resStatusSend(status, send, log) {
  console.log(log);
  return {
    status: status,
    send: send,
  };
}

/*************************/
/*    General Utilities  */
/*************************/

var genericUpdate = function(collectionName, id, action, callback) {
  var error, result, logPrefix;
  logPrefix = '[general-utilities] genericUpdate ' + collectionName;
  console.log(logPrefix + ' ' + id);

  if (!ObjectID.isValid(id)) {
    error = resStatusSend(
      400,
      server_response.toast('SERVER_ERRORS.GENERIC'),
      logPrefix + 'ERROR: Invalid Id'
    );
    return callback(error, result);
  }
  collections[collectionName].updateOne(
    { _id: ObjectID.createFromHexString(id) },
    action,
    (err, doc) => {
      if (err) {
        error = resStatusSend(
          500,
          server_response.toast('SERVER_ERRORS.INTERNAL'),
          logPrefix + 'ERROR: 500, Internal server error'
        );
        return callback(error, result);
      }
      return callback(error, doc);
    }
  );
};

var genericGetById = function(collectionName, id, callback) {
  var error, result, logPrefix;
  logPrefix = '[general-utilities] getById ' + collectionName;
  console.log(logPrefix + ' ' + id);

  if (!ObjectID.isValid(id)) {
    error = resStatusSend(
      400,
      server_response.toast('SERVER_ERRORS.GENERIC'),
      logPrefix + 'ERROR: Invalid Id'
    );
    return callback(error, result);
  }
  collections[collectionName].findOne(
    { _id: ObjectID.createFromHexString(id) },
    (err, doc) => {
      if (err) {
        error = resStatusSend(
          500,
          server_response.toast('SERVER_ERRORS.INTERNAL'),
          logPrefix + 'ERROR: 500, Internal server error'
        );
        return callback(error, result);
      }
      if (!doc) {
        error = resStatusSend(
          404,
          server_response.toast('SERVER_ERRORS.GENERIC'),
          logPrefix + 'ERROR: Id not found in ' + collectionName
        );
        return callback(error, result);
      }

      return callback(error, doc);
    }
  );
};

var genericGetMultipleByIds = function(collectionName, idsArray, callback) {
  var error, result, logPrefix;
  logPrefix = '[general-utilities] genericGetMultipleByIds ' + collectionName;
  console.log(logPrefix + ' ids ' + idsArray);

  collections[collectionName]
    .find({ _id: { $in: idsArray } })
    .toArray((err, elements) => {
      if (err) {
        error = resStatusSend(
          500,
          server_response.toast('SERVER_ERRORS.INTERNAL'),
          logPrefix + 'ERROR: 500, Internal server error'
        );
        return callback(error, result);
      }
      callback(error, elements);
    });
};

var genericFind = function(collectionName, query, callback) {
  var error, result, logPrefix;
  logPrefix = '[general-utilities] genericFind ' + collectionName;
  console.log(logPrefix);

  collections[collectionName].findOne(query, (err, doc) => {
    if (err) {
      error = resStatusSend(
        500,
        server_response.toast('SERVER_ERRORS.INTERNAL'),
        logPrefix + 'ERROR: 500, Internal server error'
      );
      return callback(error, doc);
    }

    return callback(error, doc);
  });
};

var genericMultipleFind = function(collectionName, query, callback) {
  var error, logPrefix;
  logPrefix = '[general-utilities] genericMultipleFind ' + collectionName;
  console.log(logPrefix);

  collections[collectionName].find(query).toArray((err, doc) => {
    if (err) {
      error = resStatusSend(
        500,
        server_response.toast('SERVER_ERRORS.INTERNAL'),
        logPrefix + 'ERROR: 500, Internal server error'
      );
      return callback(error, doc);
    }
    return callback(error, doc);
  });
};

var genericCreate = function(collectionName, obj, callback) {
  var error, logPrefix;
  logPrefix = '[general-utilities] genericCreate ' + collectionName;
  console.log(logPrefix);

  collections[collectionName].insertOne(obj, (err, result) => {
    if (err) {
      error = resStatusSend(
        500,
        server_response.toast('SERVER_ERRORS.INTERNAL'),
        logPrefix + 'ERROR: 500, Internal server error'
      );
      return callback(error, result);
    }
    return callback(error, result);
  });
};

var genericDelete = function(collectionName, id, callback) {
  var error, logPrefix;
  logPrefix = '[general-utilities] genericCreate ' + collectionName;
  console.log(logPrefix + ' ' + id);

  if (!ObjectID.isValid(id)) {
    error = resStatusSend(
      400,
      server_response.toast('SERVER_ERRORS.GENERIC'),
      logPrefix + 'ERROR: Invalid Id'
    );
    return callback(error, result);
  }

  collections[collectionName].deleteOne(
    { _id: ObjectID.createFromHexString(id) },
    (err, doc) => {
      if (err) {
        error = resStatusSend(
          500,
          server_response.toast('SERVER_ERRORS.INTERNAL'),
          logPrefix + 'ERROR: 500, Internal server error'
        );
        return callback(error, result);
      }
      return callback(error, doc);
    }
  );
};

var genericDistinct = function(collectionName, field, callback) {
  var error, logPrefix;
  logPrefix = '[general-utilities] genericDistinct ' + collectionName;
  console.log(logPrefix + ' ' + field);

  collections[collectionName].distinct(field, (err, doc) => {
    if (err) {
      error = resStatusSend(
        500,
        server_response.toast('SERVER_ERRORS.INTERNAL'),
        logPrefix + 'ERROR: 500, Internal server error'
      );
      return callback(error, result);
    }
    return callback(error, doc);
  });
};

module.exports = {
  genericUpdate,
  genericGetById,
  genericGetMultipleByIds,
  genericFind,
  genericMultipleFind,
  genericCreate,
  genericDelete,
  genericDistinct,
};
