/*************************/
/*  Services Utilities   */
/*************************/
/*action = 'CREATE', 'GET', 'UPDATE'*/

var serviceObjectFactory = function(action, data) {
  var service = {
    business_name: data.business_name,
    type: data.type,
    phone: data.phone,
  };
  if (action === 'GET' || action === 'UPDATE') {
    service.id = data._id.toHexString();
  }
  if (data.address) service.address = data.address;
  if (data.notes) service.notes = data.notes;
  if (data.image) service.image = data.image;
  if (data.social_media) service.social_media = data.social_media;
  return service;
};

module.exports = { serviceObjectFactory };
