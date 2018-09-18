const nodemailer = require('nodemailer');

var smtpTransport = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'pet.community.app.2018@gmail.com',
    pass: process.env.GMALIL_PSWD,
  },
});

sendCodeEmail = function(userEmail, token, lang, callback) {
  var subject, text;

  if (lang === 'es') {
    subject = 'Solicitud de cambio de contraseña';
    text =
      'Estás recibiendo este correo por que has solicitado un cambio de contraseña para tu cuenta.\n\n' +
      'Por favor ingresa el siguiente código en la aplicación para completar el proceso:\n\n' +
      'Código:  ' +
      token +
      '\n\n' +
      'Si no hiciste esta solicitud, ignora este correo y tu contraseña no será modificada.\n';
  } else {
    subject = 'Pet Community Password Reset';
    text =
      'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
      'Please, enter the follwing code in the app to complete the process:\n\n' +
      'Code:   ' +
      token +
      ' \n\n' +
      'If you did not request this, please ignore this email and your password will remain unchanged.\n';
  }

  var mailOptions = {
    to: userEmail,
    from: 'pet.community.app.2018@gmail.com',
    subject: subject,
    text: text,
  };

  smtpTransport.sendMail(mailOptions, function(err) {
    console.log('email sent');
    return callback(err);
  });
};

module.exports = { sendCodeEmail };
