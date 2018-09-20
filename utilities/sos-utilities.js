/*************************/
/*  Services Utilities   */
/*************************/
/*action = 'CREATE', 'GET', 'UPDATE'*/

var sosObjectFactory = function(action, data) {
  var sos = {
    short_description: data.short_description,
    need: data.need,
    status: data.status,
    city: data.city,
    country: data.country,
    date: data.date,
    userID_creator: data.userID_creator,
    contact_name: data.contact_name,
    contact_email: data.contact_email,
  };
  if (data.image) sos.image = data.image;
  if (data.notes) sos.notes = data.notes;
  if (data.contact_phone) sos.contact_phone = data.contact_phone;
  if (data.location) sos.location = data.location;

  if (action === 'GET') {
    if (data.helpers) sos.helpers = data.helpers;
  }

  if (action === 'GET' || action === 'UPDATE') {
    sos.id = data._id.toHexString();
  }
  return sos;
};
module.exports = { sosObjectFactory };
