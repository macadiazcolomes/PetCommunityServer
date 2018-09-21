var express = require('express'),
  config = require('../config'),
  jwt_ex = require('express-jwt'),
  utilities = require('../utilities');

const server_response = require('../services/response_formats');
var app = (module.exports = express.Router());

//database connection
var ObjectID = require('mongodb').ObjectID;

//PROTECTED ROUTES
var jwtCheck = jwt_ex({
  secret: config.secret,
});
app.use('/pca/protected', jwtCheck);

function validateIds(userId, petId, callback) {
  var error, pet;
  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return callback(err, pet);
    }
    if (
      user.pets.findIndex(
        petIdObject => petIdObject.toHexString() === petId
      ) === -1
    ) {
      error = { status: 404, send: 'Pet not found' };
      return callback(error, pet);
    }
    utilities.general.genericGetById('pets', petId, (err, pet) => {
      if (err) {
        return callback(err, pet);
      }
      return callback(error, pet);
    });
  });
}

/*****************/
/*    Routes     */
/*****************/
//all the routes are protected!
//create alert
app.post('/pca/protected/users/:userId/pets/:petId/alerts', function(req, res) {
  var userId = req.params.userId;
  var petId = req.params.petId;

  console.log(
    'POST /pca/protected/users/' + userId + '/pets/' + petId + '/alerts'
  );
  if (!userId || !petId) {
    return res.status(400).send('Missing parameter');
  }

  validateIds(userId, petId, (err, pet) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    //validations type/name/date
    if (!req.body.type) {
      return res
        .status(400)
        .send(server_response.form('type', { required: true }));
    }
    if (!req.body.name) {
      return res
        .status(400)
        .send(server_response.form('name', { required: true }));
    }
    if (!req.body.date) {
      return res
        .status(400)
        .send(server_response.form('date', { required: true }));
    }
    var alert = utilities.alert.alertObjectFactory('CREATE', req.body);
    utilities.general.genericCreate('alerts', alert, (err, result) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      //update pet alerts field
      var query = {};
      query['alerts_qtys.' + alert.type] = 1;

      var action = {
        $push: { alerts: result.insertedId },
        $inc: query,
      };
      utilities.general.genericUpdate('pets', petId, action, (err, doc) => {
        if (err) {
          return res.status(err.status).send(err.send);
        }
        alert.id = result.insertedId.toHexString();
        delete alert._id;
        return res.send(alert);
      });
    });
  });
});

//get all the alerts of one type for  one pet
app.get('/pca/protected/users/:userId/pets/:petId/alerts/t/:type', function(
  req,
  res
) {
  var userId = req.params.userId;
  var petId = req.params.petId;
  var type = req.params.type;
  var petAlerts = [];

  console.log(
    'GET /pca/protected/users/' +
      userId +
      '/pets/' +
      petId +
      '/alerts/t/' +
      type
  );
  if (!userId || !petId || !type) {
    return res.status(400).send('Missing parameter');
  }

  validateIds(userId, petId, (err, pet) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    if (pet.alerts) {
      utilities.general.genericGetMultipleByIds(
        'alerts',
        pet.alerts,
        (err, alerts) => {
          if (err) {
            return res.status(err.status).send(err.send);
          }
          petAlerts = alerts
            .map(alert => {
              return utilities.alert.alertObjectFactory('GET', alert);
            })
            .filter(alert => {
              return alert.type === type;
            });
          return res.send(petAlerts);
        }
      );
    } else {
      return res.sendStatus(204);
    }
  });
});

//get a single alert
app.get('/pca/protected/users/:userId/pets/:petId/alerts/:alertId', function(
  req,
  res
) {
  var userId = req.params.userId;
  var petId = req.params.petId;
  var alertId = req.params.alertId;

  console.log(
    'GET /pca/protected/users/' +
      userId +
      '/pets/' +
      petId +
      '/alerts/' +
      alertId
  );
  if (!userId || !petId || !alertId) {
    return res.status(400).send('Missing parameter');
  }

  validateIds(userId, petId, (err, pet) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    utilities.general.genericGetById('alerts', alertId, (err, doc) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      var alert = utilities.alert.alertObjectFactory('GET', doc);
      return res.send(alert);
    });
  });
});

//update alert
app.put('/pca/protected/users/:userId/pets/:petId/alerts/:alertId', function(
  req,
  res
) {
  var userId = req.params.userId;
  var petId = req.params.petId;
  var alertId = req.params.alertId;

  console.log(
    'PUT /pca/protected/users/' +
      userId +
      '/pets/' +
      petId +
      '/alerts/' +
      alertId
  );
  if (!userId || !petId || !alertId) {
    return res.status(400).send('Missing parameter');
  }
  //validate type/name /date
  if (!req.body.type) {
    return res
      .status(400)
      .send(server_response.form('type', { required: true }));
  }
  if (!req.body.name) {
    return res
      .status(400)
      .send(server_response.form('name', { required: true }));
  }
  if (!req.body.date) {
    return res
      .status(400)
      .send(server_response.form('date', { required: true }));
  }

  validateIds(userId, petId, (err, pet) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    utilities.general.genericGetById('alerts', alertId, (err, alert) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      var data = Object.assign({}, alert, req.body);
      var petAlerts = utilities.alert.alertObjectFactory('UPDATE', data);

      utilities.general.genericUpdate(
        'alerts',
        alertId,
        { $set: petAlerts },
        (err, doc) => {
          if (err) {
            return res.status(err.status).send(err.send);
          }
          res.send(petAlerts);
        }
      );
    });
  });
});

//delete alert
app.delete('/pca/protected/users/:userId/pets/:petId/alerts/:alertId', function(
  req,
  res
) {
  var userId = req.params.userId;
  var petId = req.params.petId;
  var alertId = req.params.alertId;

  console.log(
    'DELETE /pca/protected/users/' +
      userId +
      '/pets/' +
      petId +
      '/alerts/' +
      alertId
  );
  if (!userId || !petId || !alertId) {
    return res.status(400).send('Missing parameter');
  }

  validateIds(userId, petId, (err, pet) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    utilities.general.genericGetById('alerts', alertId, (err, alert) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      utilities.general.genericDelete('alerts', alertId, (err, result) => {
        if (err) {
          return res.status(err.status).send(err.send);
        }
        //update pet alerts
        var query = {};
        query['alerts_qtys.' + alert.type] = -1;
        var action = {
          $pull: {
            alerts: ObjectID.createFromHexString(alertId),
          },
          $inc: query,
        };
        utilities.general.genericUpdate('pets', petId, action, (err, doc) => {
          if (err) {
            return res.status(err.status).send(err.send);
          }
          return res.sendStatus(204);
        });
      });
    });
  });
});
