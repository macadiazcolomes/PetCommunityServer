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

//Create pet
app.post('/pca/protected/users/:userId/pets', function(req, res) {
  console.log('POST /pca/protected/users/:userId/pets');
  var userId = req.params.userId;
  if (!userId) {
    return res.status(400).send('Missing parameter');
  }
  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    if (!req.body.name) {
      return res
        .status(400)
        .send(server_response.form('name', { required: true }));
    }
    if (!req.body.species) {
      return res
        .status(400)
        .send(server_response.form('species', { required: true }));
    }
    var pet = utilities.pet.petObjectFactory('CREATE', req.body);
    utilities.general.genericCreate('pets', pet, (err, result) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      //update user pets field
      var action = { $push: { pets: result.insertedId } };
      utilities.general.genericUpdate('users', userId, action, (err, doc) => {
        if (err) {
          return res.status(err.status).send(err.send);
        }
      });
      pet.id = result.insertedId.toHexString();
      delete pet._id;
      return res.send(pet);
    });
  });
});

//get pet all the pets of a user
app.get('/pca/protected/users/:userId/pets', function(req, res) {
  console.log('GET /pca/protected/users/' + req.params.userId + '/pets');

  var userId = req.params.userId;
  var userPets = [];
  if (!userId) {
    return res.status(400).send('Missing parameter');
  }
  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    if (user.pets) {
      utilities.general.genericGetMultipleByIds(
        'pets',
        user.pets,
        (err, pets) => {
          if (err) {
            return res.status(err.status).send(err.send);
          }
          userPets = pets.map(pet => {
            return utilities.pet.petObjectFactory('GET', pet);
          });
          return res.send(userPets);
        }
      );
    } else {
      return res.sendStatus(204);
    }
  });
});

//get one pet
app.get('/pca/protected/users/:userId/pets/:petId', function(req, res) {
  console.log(
    'GET /pca/protected/users/:' +
      req.params.userId +
      '/pets/' +
      req.params.petId
  );
  var userId = req.params.userId;
  var petId = req.params.petId;

  if (!userId || !petId) {
    return res.status(400).send('Missing parameter');
  }
  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    utilities.general.genericGetById('pets', petId, (err, doc) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      var pet = utilities.pet.petObjectFactory('GET', doc);
      return res.send(pet);
    });
  });
});

//update pet
app.put('/pca/protected/users/:userId/pets/:petId', function(req, res) {
  console.log(
    'PUT /pca/protected/users/:' +
      req.params.userId +
      '/pets/' +
      req.params.petId
  );
  var userId = req.params.userId;
  var petId = req.params.petId;

  if (!userId || !petId) {
    return res.status(400).send('Missing parameter');
  }
  //validate required data (name, species)
  if (!req.body.name) {
    return res
      .status(400)
      .send(server_response.form('name', { required: true }));
  }
  if (!req.body.species) {
    return res
      .status(400)
      .send(server_response.form('species', { required: true }));
  }
  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    if (
      user.pets.findIndex(
        petIdObject => petIdObject.toHexString() === petId
      ) === -1
    ) {
      return res.status(404).send('Pet not found');
    }
    utilities.general.genericGetById('pets', petId, (err, pet) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      var data = Object.assign({}, pet, req.body);
      var userPets = utilities.pet.petObjectFactory('UPDATE', data);

      utilities.general.genericUpdate(
        'pets',
        petId,
        { $set: userPets },
        (err, doc) => {
          if (err) {
            return res.status(err.status).send(err.send);
          }
          res.send(userPets);
        }
      );
    });
  });
});

//delete pet
app.delete('/pca/protected/users/:userId/pets/:petId', function(req, res) {
  console.log(
    'DELETE /pca/protected/users/:' +
      req.params.userId +
      '/pets/' +
      req.params.petId
  );
  var userId = req.params.userId;
  var petId = req.params.petId;

  if (!userId || !petId) {
    return res.status(400).send('Missing parameter');
  }

  utilities.general.genericGetById('users', userId, (err, user) => {
    if (err) {
      return res.status(err.status).send(err.send);
    }
    if (
      user.pets.findIndex(
        petIdObject => petIdObject.toHexString() === petId
      ) === -1
    ) {
      return res.status(404).send('Pet not found');
    }
    utilities.general.genericDelete('pets', petId, (err, result) => {
      if (err) {
        return res.status(err.status).send(err.send);
      }
      // update user Pets
      var action = {
        $pull: { pets: { $in: [ObjectID.createFromHexString(petId)] } },
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
