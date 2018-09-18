var express = require('express'),
  _ = require('lodash'),
  config = require('./config'),
  jwt = require('jsonwebtoken'),
  jwt_ex = require('express-jwt'),
  mongoDB = require('./mongoUtil.js'),
  mailService = require('./mail_service'),
  crypto = require('crypto');

const server_response = require('./response_formats.js');

var app = (module.exports = express.Router());

//database connection
var db = mongoDB.getDB();
var ObjectID = require('mongodb').ObjectID;

// Create a new JWT Token
function createToken(user) {
  return jwt.sign(_.omit(user, 'password'), config.secret, {
    expiresIn: 60 * 60 * 5,
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
var userCol = db.collection('users');

//sessions login
app.post('/pca/sessions', function(req, res) {
  console.log('POST /pca/sessions');

  if (!req.body.email) {
    return res
      .status(400)
      .send(server_response.form('email', { required: true }));
  } else if (!req.body.password) {
    return res
      .status(400)
      .send(server_response.form('password', { required: true }));
  } else {
    userCol.findOne(
      { email: req.body.email, password: req.body.password },
      (err, doc) => {
        if (err) {
          return res
            .status(500)
            .send(server_response.toast('SERVER_ERRORS.INTERNAL'));
        } else if (!doc) {
          return res
            .status(404)
            .send(server_response.form('password', { incorrect: true }));
        } else {
          res.send({
            userId: doc._id.toHexString(),
            token: createToken(doc),
          });
        }
      }
    );
  }
});

//create user
app.post('/pca/users', function(req, res) {
  console.log('POST  /pca/users');
  if (!req.body.email) {
    return res
      .status(400)
      .send(server_response.form('email', { required: true }));
  } else if (!req.body.password) {
    return res
      .status(400)
      .send(server_response.form('password', { required: true }));
  } else if (!req.body.confirm_password) {
    return res
      .status(400)
      .send(server_response.form('passwordConfirm', { required: true }));
  } else if (!req.body.name) {
    return res
      .status(400)
      .send(server_response.form('name', { required: true }));
  } else {
    userCol.findOne({ email: req.body.email }, (err, doc) => {
      if (err) {
        return res
          .status(500)
          .send(server_response.toast('SERVER_ERRORS.INTERNAL'));
      } else if (doc) {
        return res
          .status(400)
          .send(server_response.form('email', { registered: true }));
      } else {
        if (req.body.password !== req.body.confirm_password) {
          res
            .status(400)
            .send(server_response.form('password', { mismatch: true }));
        } else {
          var user = {
            email: req.body.email,
            password: req.body.password,
            name: req.body.name,
            sos_subscription: false,
          };
          userCol.insertOne(user, (err, result) => {
            if (err) {
              return res
                .status(500)
                .send(server_response.toast('SERVER_ERRORS.INTERNAL'));
            } else {
              res.send({
                id: result.insertedId.toHexString(),
                email: user.email,
                name: user.name,
                sos_subscription: user.sos_subscription,
              });
            }
          });
        }
      }
    });
  }
});

//get user
app.get('/pca/protected/users/:userId', function(req, res) {
  console.log('GET  /pca/protected/users/' + req.params.userId);
  var userId = req.params.userId;
  if (!userId) {
    res.status(400).send('Missing parameter');
  } else {
    userCol.findOne(
      { _id: ObjectID.createFromHexString(userId) },
      (err, doc) => {
        if (err) {
          res.sendStatus(500);
        } else if (!doc) {
          res.status(404).send('User not found');
        } else {
          var user = {
            id: doc._id.toHexString(),
            email: doc.email,
            name: doc.name,
            sos_subscription: doc.sos_subscription,
          };
          if (doc.city) user.city = doc.city;
          if (doc.country) user.country = doc.country;
          if (doc.avatar) user.avatar = doc.avatar;
          if (doc.social_media) user.social_media = doc.social_media;
          if (doc.pets) user.pets = doc.pets;
          if (doc.services) user.services = doc.services;

          res.send(user);
        }
      }
    );
  }
});

//update user
app.put('/pca/protected/users/:userId', function(req, res) {
  console.log('PUT  /pca/protected/users/' + req.params.userId);
  var userId = req.params.userId;

  if (!userId) {
    res.status(400).send('Missing parameter');
  } else {
    userCol.findOne(
      { _id: ObjectID.createFromHexString(userId) },
      (err, doc) => {
        if (err) {
          res.sendStatus(500);
        } else if (!doc) {
          res.status(404).send('User not found');
        } else {
          var user = {
            id: doc._id.toHexString(),
            email: req.body.email || doc.email,
            name: req.body.name || doc.name,
            sos_subscription: req.body.sos_subscription || doc.sos_subscription,
          };
          if (req.body.city) user.city = req.body.city;
          if (req.body.country) user.country = req.body.country;
          if (req.body.password) user.password = req.body.password;
          if (req.body.avatar) user.avatar = req.body.avatar;
          if (req.body.social_media) user.social_media = req.body.social_media;

          userCol.updateOne(
            { _id: ObjectID.createFromHexString(userId) },
            { $set: user },
            (err, doc) => {
              if (err) {
                res.status(500).send(err);
              } else {
                res.send(user);
              }
            }
          );
        }
      }
    );
  }
});

//delete user
app.delete('/pca/protected/users/:userId', function(req, res) {
  console.log('DELETE  /pca/protected/users/' + req.params.userId);

  var userId = req.params.userId;

  if (!userId) {
    res.status(400).send('Missing parameter');
  } else {
    userCol.deleteOne(
      { _id: ObjectID.createFromHexString(userId) },
      (err, doc) => {
        if (err) {
          res.status(500).send(err);
        } else {
          res.sendStatus(204);
        }
      }
    );
  }
});

//Forgot password steps (not protected)
app.post('/pca/forgot/step1', function(req, res) {
  console.log('POST /pca/forgot/step1');

  var userEmail = req.body.userEmail;
  var userLang = req.body.userLang;
  console.log('userlang', userLang);

  if (!userEmail) {
    res.status(400).send(server_response.form('email', { required: true }));
  } else {
    userCol.findOne({ email: userEmail }, (err, doc) => {
      if (err) {
        return res
          .status(500)
          .send(server_response.toast('SERVER_ERRORS.INTERNAL'));
      } else if (!doc) {
        return res
          .status(404)
          .send(server_response.form('email', { notexists: true }));
      } else {
        //we send the email with a code
        crypto.randomBytes(3, function(err, buf) {
          if (err) {
            return res
              .status(500)
              .send(server_response.toast('SERVER_ERRORS.INTERNAL'));
          } else {
            var token = buf.toString('hex');
            //save token
            userCol.updateOne(
              { email: userEmail },
              {
                $set: {
                  resetPasswordToken: token,
                  resetPasswordExpires: Date.now() + 36000000,
                },
              },
              (err, doc) => {
                if (err) {
                  return res
                    .status(500)
                    .send(server_response.toast('SERVER_ERRORS.INTERNAL'));
                } else {
                  //send token
                  mailService.sendCodeEmail(userEmail, token, userLang, err => {
                    if (err) {
                      console.log('Error sending email');
                      return res
                        .status(500)
                        .send(server_response.toast('SERVER_ERRORS.INTERNAL'));
                    } else {
                      res.sendStatus(204);
                    }
                  });
                }
              }
            );
          }
        });
      }
    });
  }
});

app.post('/pca/forgot/step2', function(req, res) {
  console.log('POST /pca/forgot/step2');

  var userEmail = req.body.userEmail;
  var userCode = req.body.userCode;

  if (!userEmail) {
    return res
      .status(400)
      .send(server_response.form('email', { required: true }));
  } else if (!userCode) {
    return res
      .status(400)
      .send(server_response.form('code', { required: true }));
  } else {
    userCol.findOne(
      {
        email: userEmail,
        resetPasswordToken: userCode,
        resetPasswordExpires: { $gt: Date.now() },
      },
      function(err, user) {
        if (err) {
          console.log('Error getting user data');
          return res
            .status(500)
            .send(server_response.toast('SERVER_ERRORS.INTERNAL'));
        } else if (!user) {
          return res
            .status(400)
            .send(server_response.form('code', { invalid: true }));
        } else {
          userCol.updateOne(
            { _id: user._id },
            {
              $set: {
                resetPasswordToken: undefined,
                resetPasswordExpires: undefined,
              },
            },
            (err, doc) => {
              if (err) {
                console.log('Error updating code to undefined');
                return res
                  .status(500)
                  .send(server_response.toast('SERVER_ERRORS.INTERNAL'));
              } else {
                res.sendStatus(204);
              }
            }
          );
        }
      }
    );
  }
});

app.post('/pca/forgot/step3', function(req, res) {
  console.log('POST /pca/forgot/step3');

  var password = req.body.password;
  var passwordConfirm = req.body.passwordConfirm;

  if (!password) {
    res.status(400).send(server_response.form('password', { required: true }));
  } else if (!passwordConfirm) {
    res
      .status(400)
      .send(server_response.form('passwordConfirm', { required: true }));
  } else if (password !== passwordConfirm) {
    res
      .status(400)
      .send(server_response.form('passwordConfirm', { mismatch: true }));
  } else {
    userCol.updateOne(
      { email: this.email },
      {
        $set: {
          password: password,
        },
      },
      (err, doc) => {
        if (err) {
          console.log('Error', err);
          return res
            .status(500)
            .send(server_response.toast('SERVER_ERRORS.INTERNAL'));
        } else {
          res.sendStatus(204);
        }
      }
    );
  }
});
