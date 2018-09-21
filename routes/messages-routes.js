var express = require('express'),
  config = require('../config'),
  jwt_ex = require('express-jwt'),
  utilities = require('../utilities');

const server_response = require('../services/response_formats');
var app = (module.exports = express.Router());

var ObjectID = require('mongodb').ObjectID;

//PROTECTED ROUTES
var jwtCheck = jwt_ex({
  secret: config.secret,
});
app.use('/pca/protected', jwtCheck);

function validateIds(userId, sosId, callback) {
  var error, usr, usrSos;
  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return callback(err, user, usrSos);
    }
    utilities.general.genericGetById('sos', sosId, (err, sos) => {
      if (err) {
        return callback(err, user, sos);
      }
      //check if user is creator or helper
      if (
        !user._id.equals(sos.userID_creator) &&
        sos.helpers.indexOf(userId) > -1
      ) {
        error = { status: 404, send: 'User is not paticipating in this SOS' };
        return callback(error, usr, usrSos);
      }
      return callback(error, user, sos);
    });
  });
}

/*****************/
/*    Routes     */
/*****************/
//all the routes are protected!

//create message
app.post('/pca/protected/users/:userId/sos/:sosId/messages', function(
  req,
  res
) {
  console.log(
    'POST /pca/protected/users/' +
      req.params.userId +
      '/sos/' +
      req.params.sosId +
      '/messages'
  );
  var userId = req.params.userId;
  var sosId = req.params.sosId;
  if (!userId || !sosId) {
    return res.status(400).send('Missing parameter');
  }

  //validate required data
  if (!req.body.helperID || !req.body.type) {
    return res.status(400).send('Missing parameter');
  }
  if (req.body.sosId !== sosId) {
    return res.status(400).send('sosId does not match');
  }
  if (!req.body.message) {
    return res
      .status(400)
      .send(server_response.form('message', { required: true }));
  }
  validateIds(userId, sosId, (err, user, sos) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    var message = utilities.messages.messageObjectFactory('CREATE', req.body);
    message.helperID = ObjectID.createFromHexString(req.body.helperID);
    message.sosId = sos._id;
    utilities.general.genericCreate('messages', message, (err, result) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      message.id = result.insertedId.toHexString();
      delete message._id;
      return res.send(message);
    });
  });
});

//get all the helpers that have send or received messages for this sos
app.get('/pca/protected/users/:userId/sos/:sosId/messages/helpers', function(
  req,
  res
) {
  console.log(
    'GET /pca/protected/users/' +
      req.params.userId +
      '/sos/' +
      req.params.sosId +
      '/messages/helpers'
  );
  var userId = req.params.userId;
  var sosId = req.params.sosId;
  var usersArray = [];
  if (!userId || !sosId) {
    return res.status(400).send('Missing parameter');
  }

  validateIds(userId, sosId, (err, user, sos) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    utilities.general.genericDistinct(
      'messages',
      'helperID',
      (err, helperIDs) => {
        if (err) {
          return res.status(err.status).send(err.send);
        }

        var query = { _id: { $in: helperIDs } };
        utilities.general.genericMultipleFind('users', query, (err, users) => {
          if (err) {
            return res.status(err.status).send(err.send);
          }
          usersArray = users.map(user => {
            return utilities.user.userObjectFactory('GET', user);
          });
          return res.send(usersArray);
        });
      }
    );
  });
});

//get all the SOS messages with one user (helper)
app.get(
  '/pca/protected/users/:userId/sos/:sosId/messages/helper/:helperId',
  function(req, res) {
    console.log(
      'GET /pca/protected/users/' +
        req.params.userId +
        '/sos/' +
        req.params.sosId +
        '/messages/helper/' +
        req.params.helperId
    );
    var userId = req.params.userId;
    var sosId = req.params.sosId;
    var helperId = req.params.helperId;
    var sosMessages = [];
    if (!userId || !sosId || !helperId) {
      return res.status(400).send('Missing parameter');
    }
    validateIds(userId, sosId, (err, user, sos) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      var query = {
        sosId: sos._id,
        helperID: ObjectID.createFromHexString(helperId),
      };
      utilities.general.genericMultipleFind(
        'messages',
        query,
        (err, messages) => {
          if (err) {
            return res.status(err.status).send(err.send);
          }
          sosMessages = messages.map(message => {
            return utilities.messages.messageObjectFactory('GET', message);
          });
          return res.send(sosMessages);
        }
      );
    });
  }
);

//update message (mark as read)
app.put('/pca/protected/users/:userId/sos/:sosId/messages/:messageId', function(
  req,
  res
) {
  console.log(
    'PUT /pca/protected/users/' +
      req.params.userId +
      '/sos/' +
      req.params.sosId +
      '/messages/' +
      req.params.messageId
  );
  var userId = req.params.userId;
  var sosId = req.params.sosId;
  var messageId = req.params.messageId;

  if (!userId || !sosId || !messageId) {
    return res.status(400).send('Missing parameter');
  }

  validateIds(userId, sosId, (err, user, sos) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    utilities.general.genericGetById('messages', messageId, (err, message) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      if (!message.sosId.equals(sos._id)) {
        return res.status(404).send('this message s not part of the SOS');
      }
      var data = Object.assign({}, message, req.body);
      var sosMessage = utilities.messages.messageObjectFactory('UPDATE', data);
      sosMessage.sosId = sos._id;
      sosMessage.helperID = ObjectID.createFromHexString(sosMessage.helperID);

      utilities.general.genericUpdate(
        'messages',
        messageId,
        { $set: sosMessage },
        (err, result) => {
          if (err) {
            return res.status(err.status).send(err.send);
          }
          res.send(sosMessage);
        }
      );
    });
  });
});
//delete message
app.delete(
  '/pca/protected/users/:userId/sos/:sosId/messages/:messageId',
  function(req, res) {
    console.log(
      'DELETE /pca/protected/users/' +
        req.params.userId +
        '/sos/' +
        req.params.sosId +
        '/messages/' +
        req.params.messageId
    );
    var userId = req.params.userId;
    var sosId = req.params.sosId;
    var messageId = req.params.messageId;

    if (!userId || !sosId || !messageId) {
      return res.status(400).send('Missing parameter');
    }

    validateIds(userId, sosId, (err, user, sos) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      utilities.general.genericGetById(
        'messages',
        messageId,
        (err, message) => {
          if (err) {
            return res.status(err.status).send(err.send);
          }
          if (!message.sosId.equals(sos._id)) {
            return res.status(404).send('this message s not part of the SOS');
          }
          utilities.general.genericDelete(
            'messages',
            messageId,
            (err, result) => {
              if (err) {
                return res.status(err.status).send(err.send);
              }
              return res.sendStatus(204);
            }
          );
        }
      );
    });
  }
);
