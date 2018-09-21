/*************************/
/*    Pets Utilities     */
/*************************/
/*action = 'CREATE', 'GET', 'UPDATE'*/
var petObjectFactory = function(action, data) {
  console.log('[pets-utilities] userObjectFactory');
  var pet = {
    name: data.name,
    species: data.species,
  };

  if (action === 'GET' || action === 'UPDATE') {
    pet.id = data._id.toHexString();
  }
  if (action === 'GET') {
    if (data.alerts) pet.alerts = data.alerts;
    if (data.alerts_qtys) pet.alerts_qtys = data.alerts_qtys;
  }

  if (data.avatar) pet.avatar = data.avatar;
  if (data.breed) pet.breed = data.breed;
  if (data.gender) pet.gender = data.gender;
  if (data.birthday) pet.birthday = data.birthday;
  if (data.color) pet.color = data.color;
  if (data.neutered) pet.neutered = data.neutered;
  if (data.microchip) pet.microchip = data.microchip;
  if (data.permanent_home) pet.permanent_home = data.permanent_home;
  if (data.pass_away) pet.pass_away = data.pass_away;
  if (data.social_media) pet.social_media = data.social_media;

  return pet;
};

module.exports = { petObjectFactory };
