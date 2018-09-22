/*************************/
/*    Alerts Utilities     */
/*************************/
/*action = 'CREATE', 'GET', 'UPDATE'*/
var alertObjectFactory = function(action, data) {
  console.log('[alerts-utilities] alertObjectFactory');
  var alert = {
    type: data.type,
    name: data.name,
    date: data.date,
  };

  if (action === 'GET' || action === 'UPDATE') {
    alert.id = data._id.toHexString();
  }
  if (data.service) alert.service = data.service;
  if (data.notes) alert.notes = data.notes;
  if (data.reminder) alert.reminder = data.reminder;
  if (data.reminder_time) alert.reminder_time = data.reminder_time;
  if (data.reminder_id) alert.reminder_id = data.reminder_id;

  return alert;
};

module.exports = { alertObjectFactory };
