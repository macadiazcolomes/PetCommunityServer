var express = require('express'),
  _ = require('lodash'),
  config = require('../config'),
  jwt = require('jsonwebtoken'),
  jwt_ex = require('express-jwt'),
  utilities = require('../utilities'),
  mailService = require('../services/mail_service'),
  crypto = require('crypto');

const server_response = require('../services/response_formats');

var app = (module.exports = express.Router());

// Create a new JWT Token
function createToken(user) {
  return jwt.sign(_.omit(user, 'password'), config.secret, {
    expiresIn: '7d',
  });
}

//PROTECTED ROUTES
var jwtCheck = jwt_ex({
  secret: config.secret,
});
app.use('/pca/protected', jwtCheck);

/*****************/
/*    Routes     */
/*****************/
//sessions login
app.post('/pca/sessions', function(req, res) {
  console.log('POST /pca/sessions');

  if (!req.body.email) {
    return res
      .status(400)
      .send(server_response.form('email', { required: true }));
  }
  if (!req.body.password) {
    return res
      .status(400)
      .send(server_response.form('password', { required: true }));
  }
  utilities.general.genericFind(
    'users',
    { email: req.body.email, password: req.body.password },
    (err, doc) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      if (!doc) {
        return res
          .status(404)
          .send(server_response.form('password', { incorrect: true }));
      }
      res.send({
        userId: doc._id.toHexString(),
        token: createToken({ id: doc._id.toHexString(), email: doc.email }),
      });
    }
  );
});

//create user
app.post('/pca/users', function(req, res) {
  console.log('POST  /pca/users');
  if (!req.body.email) {
    return res
      .status(400)
      .send(server_response.form('email', { required: true }));
  }
  if (!req.body.password) {
    return res
      .status(400)
      .send(server_response.form('password', { required: true }));
  }
  if (!req.body.confirm_password) {
    return res
      .status(400)
      .send(server_response.form('passwordConfirm', { required: true }));
  }
  if (!req.body.name) {
    return res
      .status(400)
      .send(server_response.form('name', { required: true }));
  }
  utilities.general.genericFind(
    'users',
    { email: req.body.email },
    (err, doc) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      //if email exists, error
      if (doc) {
        return res
          .status(400)
          .send(server_response.form('email', { registered: true }));
      }
      //if passwords does not match, error
      if (req.body.password !== req.body.confirm_password) {
        return res
          .status(400)
          .send(server_response.form('password', { mismatch: true }));
      }
      var user = utilities.user.userObjectFactory('CREATE', req.body);

      utilities.general.genericCreate('users', user, (err, result) => {
        if (err) {
          return res.status(err.status).send(err.send);
        }
        user.id = result.insertedId.toHexString();
        delete user._id;
        return res.send(user);
      });
    }
  );
});

//get user
app.get('/pca/protected/users/:userId', function(req, res) {
  console.log('GET  /pca/protected/users/' + req.params.userId);
  var userId = req.params.userId;
  if (!userId) {
    return res.status(400).send('Missing parameter');
  }
  utilities.general.genericGetById('users', userId, (err, doc) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    var user = utilities.user.userObjectFactory('GET', doc);
    res.send(user);
  });
  /*utilities.user.getUserById(userId, (err, doc) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    var user = utilities.user.userObjectFactory('GET', doc);
    res.send(user);
  });*/
});

//update user
app.put('/pca/protected/users/:userId', function(req, res) {
  console.log('PUT  /pca/protected/users/' + req.params.userId);
  var userId = req.params.userId;

  if (!userId) {
    return res.status(400).send('Missing parameter');
  }
  utilities.general.genericGetById('users', userId, (err, doc) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    var data = Object.assign({}, doc, req.body);
    var user = utilities.user.userObjectFactory('UPDATE', data);

    utilities.general.genericUpdate(
      'users',
      userId,
      { $set: user },
      (err, doc) => {
        if (err) {
          return res.status(err.status).send(err.send);
        }
        return res.send(user);
      }
    );
  });
});

//delete user
app.delete('/pca/protected/users/:userId', function(req, res) {
  console.log('DELETE  /pca/protected/users/' + req.params.userId);

  var userId = req.params.userId;

  if (!userId) {
    return res.status(400).send('Missing parameter');
  }
  utilities.general.genericDelete('users', userId, (err, doc) => {
    if (err) {
      return res.status(err.status).send(res.send);
    }
    res.sendStatus(204);
  });
});

//Forgot password steps (not protected)
app.post('/pca/forgot/step1', function(req, res) {
  console.log('POST /pca/forgot/step1');

  var userEmail = req.body.userEmail;
  var userLang = req.body.userLang;
  console.log('userlang', userLang);

  if (!userEmail) {
    return res
      .status(400)
      .send(server_response.form('email', { required: true }));
  }
  utilities.general.genericFind('users', { email: userEmail }, (err, doc) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    if (!doc) {
      return res
        .status(404)
        .send(server_response.form('email', { notexists: true }));
    }
    //we send the email with a code
    crypto.randomBytes(3, function(err, buf) {
      if (err) {
        return res
          .status(500)
          .send(server_response.toast('SERVER_ERRORS.INTERNAL'));
      }
      var token = buf.toString('hex');
      //save token
      //et user id

      utilities.general.genericFind(
        'users',
        { email: userEmail },
        (err, doc) => {
          if (err) {
            return res.status(err.status).send(err.send);
          }
          var userId = utilities.user.userObjectFactory('GET', doc).id;

          var set = {
            resetPasswordToken: token,
            resetPasswordExpires: Date.now() + 36000000,
          };
          utilities.general.genericUpdate(
            'users',
            userId,
            { $set: set },
            (err, doc) => {
              if (err) {
                return res.status(err.status).send(err.send);
              }
              //send token
              mailService.sendCodeEmail(userEmail, token, userLang, err => {
                if (err) {
                  console.log('Error sending email');
                  return res
                    .status(500)
                    .send(server_response.toast('SERVER_ERRORS.INTERNAL'));
                }
                res.sendStatus(204);
              });
            }
          );
        }
      );
    });
  });
});

app.post('/pca/forgot/step2', function(req, res) {
  console.log('POST /pca/forgot/step2');

  var userEmail = req.body.userEmail;
  var userCode = req.body.userCode;

  if (!userEmail) {
    return res
      .status(400)
      .send(server_response.form('email', { required: true }));
  }
  if (!userCode) {
    return res
      .status(400)
      .send(server_response.form('code', { required: true }));
  }
  var query = {
    email: userEmail,
    resetPasswordToken: userCode,
    resetPasswordExpires: { $gt: Date.now() },
  };
  utilities.general.genericFind('users', query, (err, doc) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    if (!doc) {
      return res
        .status(400)
        .send(server_response.form('code', { invalid: true }));
    }
    var set = {
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
    };
    userId = utilities.user.userObjectFactory('GET', doc).id;
    utilities.general.genericUpdate(
      'users',
      userId,
      { $set: set },
      (err, doc) => {
        if (err) {
          return res.status(err.status).send(err.send);
        }
        return res.sendStatus(204);
      }
    );
  });
});

app.post('/pca/forgot/step3', function(req, res) {
  console.log('POST /pca/forgot/step3');
  var userEmail = req.body.userEmail;
  var password = req.body.password;
  var passwordConfirm = req.body.passwordConfirm;

  if (!password) {
    return res
      .status(400)
      .send(server_response.form('password', { required: true }));
  }
  if (!passwordConfirm) {
    return res
      .status(400)
      .send(server_response.form('passwordConfirm', { required: true }));
  }
  if (password !== passwordConfirm) {
    return res
      .status(400)
      .send(server_response.form('passwordConfirm', { mismatch: true }));
  }

  utilities.general.genericFind('users', { email: userEmail }, (err, doc) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    var userId = utilities.user.userObjectFactory('GET', doc).id;
    var set = { password: password };
    utilities.general.genericUpdate(
      'users',
      userId,
      { $set: set },
      (err, doc) => {
        if (err) {
          return res.status(err.status).send(err.send);
        }
        return res.sendStatus(204);
      }
    );
  });
});
