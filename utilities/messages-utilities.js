/*************************/
/*  Services Utilities   */
/*************************/
/*action = 'CREATE', 'GET', 'UPDATE'*/

var messageObjectFactory = function(action, data) {
  var message = {
    sosId: data.sosId,
    date: data.dote,
    type: data.type,
    helperID: data.helperID,
    message: data.message,
    read: data.read,
  };

  if (action === 'GET' || action === 'UPDATE') {
    message.id = data._id.toHexString();
  }
  return message;
};

module.exports = { messageObjectFactory };
