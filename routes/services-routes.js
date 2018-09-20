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

/*****************/
/*    Routes     */
/*****************/
//all the routes are protected!

//create services
app.post('/pca/protected/users/:userId/services', function(req, res) {
  console.log('POST /pca/protected/users/:userId/services');
  var userId = req.params.userId;
  if (!userId) {
    return res.status(400).send('Missing parameter');
  }
  //validate required data business_name/type/phone
  if (!req.body.business_name) {
    return res
      .status(400)
      .send(server_response.form('business_name', { required: true }));
  }
  if (!req.body.type) {
    return res
      .status(400)
      .send(server_response.form('type', { required: true }));
  }
  if (!req.body.phone) {
    return res
      .status(400)
      .send(server_response.form('phone', { required: true }));
  }

  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    var service = utilities.service.serviceObjectFactory('CREATE', req.body);
    utilities.general.genericCreate('services', service, (err, result) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      //update user services
      var action = { $push: { services: result.insertedId } };
      utilities.general.genericUpdate('users', userId, action, (err, doc) => {
        if (err) {
          return res.status(err.status).send(err.send);
        }
      });
      service.id = result.insertedId.toHexString();
      delete service._id;
      return res.send(service);
    });
  });
});

//get user services
app.get('/pca/protected/users/:userId/services', function(req, res) {
  console.log('GET /pca/protected/users/:' + req.params.userId + '/services');
  var userId = req.params.userId;
  var userServices = [];
  if (!userId) {
    return res.status(400).send('Missing parameter');
  }

  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    if (user.services) {
      utilities.general.genericGetMultipleByIds(
        'services',
        user.services,
        (err, services) => {
          if (err) {
            return res.status(err.status).send(err.send);
          }
          userServices = services.map(service => {
            return utilities.service.serviceObjectFactory('GET', service);
          });
          return res.send(userServices);
        }
      );
    } else {
      return res.sendStatus(204);
    }
  });
});

//get one service
app.get('/pca/protected/users/:userId/services/:serviceId', function(req, res) {
  console.log(
    'GET /pca/protected/users/' +
      req.params.userId +
      '/services/' +
      req.params.serviceId
  );
  var userId = req.params.userId;
  var serviceId = req.params.serviceId;

  if (!userId || !serviceId) {
    return res.status(400).send('Missing parameter');
  }
  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    if (
      user.services.findIndex(
        serviceIdObject => serviceIdObject.toHexString() === serviceId
      ) === -1
    ) {
      return res.status(404).send('Service not found');
    }
    utilities.general.genericGetById('services', serviceId, (err, doc) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      var service = utilities.service.serviceObjectFactory('GET', doc);
      return res.send(service);
    });
  });
});

//update service
app.put('/pca/protected/users/:userId/services/:serviceId', function(req, res) {
  console.log(
    'PUT /pca/protected/users/' +
      req.params.userId +
      '/services/' +
      req.params.serviceId
  );
  var userId = req.params.userId;
  var serviceId = req.params.serviceId;

  if (!userId || !serviceId) {
    return res.status(400).send('Missing parameter');
  }
  //validate required data business_name/type/phone
  if (!req.body.business_name) {
    return res
      .status(400)
      .send(server_response.form('business_name', { required: true }));
  }
  if (!req.body.type) {
    return res
      .status(400)
      .send(server_response.form('type', { required: true }));
  }
  if (!req.body.phone) {
    return res
      .status(400)
      .send(server_response.form('phone', { required: true }));
  }
  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    if (
      user.services.findIndex(
        serviceIdObject => serviceIdObject.toHexString() === serviceId
      ) === -1
    ) {
      return res.status(404).send('Service not found');
    }
    utilities.general.genericGetById('services', serviceId, (err, service) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      var data = Object.assign({}, service, req.body);
      var userServices = utilities.service.serviceObjectFactory('UPDATE', data);

      utilities.general.genericUpdate(
        'services',
        serviceId,
        { $set: userServices },
        (err, doc) => {
          if (err) {
            return res.status(err.status).send(err.send);
          }
          res.send(userServices);
        }
      );
    });
  });
});

//delete service
app.delete('/pca/protected/users/:userId/services/:serviceId', function(
  req,
  res
) {
  console.log(
    'DELETE /pca/protected/users/' +
      req.params.userId +
      '/services/' +
      req.params.serviceId
  );
  var userId = req.params.userId;
  var serviceId = req.params.serviceId;

  if (!userId || !serviceId) {
    return res.status(400).send('Missing parameter');
  }

  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    if (
      user.services.findIndex(
        serviceIdObject => serviceIdObject.toHexString() === serviceId
      ) === -1
    ) {
      return res.status(404).send('Service not found');
    }
    utilities.general.genericDelete('services', serviceId, (err, result) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      //update user services
      var action = {
        $pull: { services: { $in: [ObjectID.createFromHexString(serviceId)] } },
      };
      utilities.general.genericUpdate('users', userId, action, (err, doc) => {
        if (err) {
          return res.status(err.status).send(err.send);
        }
        return res.sendStatus(204);
      });
    });
  });
});
