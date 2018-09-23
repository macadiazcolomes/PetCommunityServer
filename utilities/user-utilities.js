/*************************/
/*    User Utilities     */
/*************************/
/*action = 'CREATE', 'GET', 'UPDATE'*/
var userObjectFactory = function(action, data) {
  console.log('[user-utilities] userObjectFactory');
  var user = {
    email: data.email,
    name: data.name,
    sos_subscription: data.sos_subscription || false,
  };
  if (action === 'CREATE') {
    user.password = data.password;
  }
  if (action === 'GET' || action === 'UPDATE') {
    user.id = data._id.toHexString();
    if (data.city) user.city = data.city;
    if (data.country) user.country = data.country;
    if (data.avatar) user.avatar = data.avatar;
    if (data.social_media) user.social_media = data.social_media;
    if (data.push_notification_ids) {
      user.push_notification_ids = data.push_notification_ids;
    } else {
      user.push_notification_ids = [];
    }
  }
  if (action === 'GET') {
    if (data.pets) user.pets = data.pets;
    if (data.services) user.services = data.services;
  }

  return user;
};

module.exports = {
  userObjectFactory,
};
