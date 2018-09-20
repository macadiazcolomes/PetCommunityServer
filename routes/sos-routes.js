var express = require('express'),
  config = require('../config'),
  jwt_ex = require('express-jwt'),
  utilities = require('../utilities');

const server_response = require('../services/response_formats');
var app = (module.exports = express.Router());

//PROTECTED ROUTES
var jwtCheck = jwt_ex({
  secret: config.secret,
});
app.use('/pca/protected', jwtCheck);

/*****************/
/*    Routes     */
/*****************/
//all the routes are protected!

//create sos
app.post('/pca/protected/users/:userId/sos', function(req, res) {
  console.log('POST /pca/protected/users/:userId/sos');
  var userId = req.params.userId;
  if (!userId) {
    return res.status(400).send('Missing parameter');
  }
  // validate required data
  if (!req.body.short_description) {
    return res
      .status(400)
      .send(server_response.form('short_description', { required: true }));
  }
  if (!req.body.need) {
    return res
      .status(400)
      .send(server_response.form('need', { required: true }));
  }
  if (!req.body.status) {
    return res
      .status(400)
      .send(server_response.form('status', { required: true }));
  }
  if (!req.body.city) {
    return res
      .status(400)
      .send(server_response.form('city', { required: true }));
  }
  if (!req.body.country) {
    return res
      .status(400)
      .send(server_response.form('country', { required: true }));
  }
  if (!req.body.userID_creator) {
    return res
      .status(400)
      .send(server_response.form('userID_creator', { required: true }));
  }
  if (!req.body.contact_name) {
    return res
      .status(400)
      .send(server_response.form('contact_name', { required: true }));
  }
  if (!req.body.contact_email) {
    return res
      .status(400)
      .send(server_response.form('contact_email', { required: true }));
  }

  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    var sos = utilities.sos.sosObjectFactory('CREATE', req.body);
    sos.userID_creator = user._id;
    utilities.general.genericCreate('sos', sos, (err, result) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      sos.id = result.insertedId.toHexString();
      delete sos._id;
      return res.send(sos);
    });
  });
});

//get current sos in city (status = active)
app.get('/pca/protected/users/:userId/sos/current', function(req, res) {
  console.log(
    'GET /pca/protected/users/' + req.params.userId + '/sos/createdby'
  );
  var userId = req.params.userId;
  var currentSOS = [];
  if (!userId) {
    return res.status(400).send('Missing parameter');
  }
  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    var query = { status: 'active', city: user.city, country: user.country };
    utilities.general.genericMultipleFind('sos', query, (err, soss) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      currentSOS = soss.map(sos => {
        return utilities.sos.sosObjectFactory('GET', sos);
      });
      return res.send(currentSOS);
    });
  });
});

//get sos created by user
app.get('/pca/protected/users/:userId/sos/createdby', function(req, res) {
  console.log(
    'GET /pca/protected/users/' + req.params.userId + '/sos/createdby'
  );
  var userId = req.params.userId;
  var userSOS = [];
  if (!userId) {
    return res.status(400).send('Missing parameter');
  }
  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    var query = { userID_creator: user._id };
    utilities.general.genericMultipleFind('sos', query, (err, soss) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      userSOS = soss.map(sos => {
        return utilities.sos.sosObjectFactory('GET', sos);
      });
      if (userSOS.length > 0) {
        return res.send(userSOS);
      } else {
        return res.sendStatus(204);
      }
    });
  });
});

//get sos helped out by user
app.get('/pca/protected/users/:userId/sos/helpedout', function(req, res) {
  console.log(
    'GET /pca/protected/users/' + req.params.userId + '/sos/helpedout'
  );
  var userId = req.params.userId;
  var userhelpingSOS = [];
  if (!userId) {
    return res.status(400).send('Missing parameter');
  }
  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    var query = { helpers: { $in: [user._id] } };
    utilities.general.genericMultipleFind('sos', query, (err, soss) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      userhelpingSOS = soss.map(sos => {
        return utilities.sos.sosObjectFactory('GET', sos);
      });
      if (userhelpingSOS.length > 0) {
        return res.send(userhelpingSOS);
      } else {
        return res.sendStatus(204);
      }
    });
  });
});

//get sos by id
app.get('/pca/protected/users/:userId/sos/:sosId', function(req, res) {
  console.log(
    'GET /pca/protected/users/' + req.params.userId + '/sos/' + req.param.sosId
  );
  var userId = req.params.userId;
  var sosId = req.params.sosId;
  if (!userId || !sosId) {
    return res.status(400).send('Missing parameter');
  }
  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    utilities.general.genericGetById('sos', sosId, (err, doc) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      var sos = utilities.sos.sosObjectFactory('GET', doc);
      return res.send(sos);
    });
  });
});

//update sos
app.put('/pca/protected/users/:userId/sos/:sosId', function(req, res) {
  console.log(
    'PUT /pca/protected/users/' + req.params.userId + '/sos/' + req.param.sosId
  );
  var userId = req.params.userId;
  var sosId = req.params.sosId;
  if (!userId || !sosId) {
    return res.status(400).send('Missing parameter');
  }
  // validate required data
  if (!req.body.short_description) {
    return res
      .status(400)
      .send(server_response.form('short_description', { required: true }));
  }
  if (!req.body.need) {
    return res
      .status(400)
      .send(server_response.form('need', { required: true }));
  }
  if (!req.body.status) {
    return res
      .status(400)
      .send(server_response.form('status', { required: true }));
  }
  if (!req.body.city) {
    return res
      .status(400)
      .send(server_response.form('city', { required: true }));
  }
  if (!req.body.country) {
    return res
      .status(400)
      .send(server_response.form('country', { required: true }));
  }
  if (!req.body.userID_creator) {
    return res
      .status(400)
      .send(server_response.form('userID_creator', { required: true }));
  }
  if (!req.body.contact_name) {
    return res
      .status(400)
      .send(server_response.form('contact_name', { required: true }));
  }
  if (!req.body.contact_email) {
    return res
      .status(400)
      .send(server_response.form('contact_email', { required: true }));
  }
  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    utilities.general.genericGetById('sos', sosId, (err, sos) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }

      if (!sos.userID_creator.equals(user._id)) {
        return res
          .status(404)
          .send('This user can not update the SOS, it is not the owner');
      }
      var data = Object.assign({}, sos, req.body);
      var userSos = utilities.sos.sosObjectFactory('UPDATE', data);
      userSos.userID_creator = user._id;
      utilities.general.genericUpdate(
        'sos',
        sosId,
        { $set: userSos },
        (err, doc) => {
          if (err) {
            return res.status(err.status).send(err.send);
          }
          res.send(userSos);
        }
      );
    });
  });
});

//update sosHelpers
app.put('/pca/protected/users/:userId/sos/:sosId/helper', function(req, res) {
  console.log(
    'PUT /pca/protected/users/' +
      req.params.userId +
      '/sos/' +
      req.param.sosId +
      'helper'
  );
  var userId = req.params.userId;
  var sosId = req.params.sosId;
  if (!userId || !sosId) {
    return res.status(400).send('Missing parameter');
  }
  var doHelp = req.body.doHelp;
  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    utilities.general.genericGetById('sos', sosId, (err, sos) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      var action;
      if (doHelp) {
        action = { $push: { helpers: user._id } };
      } else {
        action = { $pull: { helpers: user._id } };
      }
      utilities.general.genericUpdate('sos', sosId, action, (err, doc) => {
        if (err) {
          return res.status(err.status).send(err.send);
        }
        res.send(utilities.sos.sosObjectFactory('GET', sos));
      });
    });
  });
});

//delete sos
app.delete('/pca/protected/users/:userId/sos/:sosId', function(req, res) {
  console.log(
    'DELETE /pca/protected/users/' +
      req.params.userId +
      '/sos/' +
      req.param.sosId
  );
  var userId = req.params.userId;
  var sosId = req.params.sosId;
  if (!userId || !sosId) {
    return res.status(400).send('Missing parameter');
  }
  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    utilities.general.genericGetById('sos', sosId, (err, sos) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      if (!sos.userID_creator.equals(user._id)) {
        return res
          .status(404)
          .send('This user can not delete the SOS, it is not the owner');
      }
      utilities.general.genericDelete('sos', sosId, (err, result) => {
        if (err) {
          return res.status(err.status).send(err.send);
        }
        return res.sendStatus(204);
      });
    });
  });
});
