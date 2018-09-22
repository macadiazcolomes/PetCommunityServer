var logger = require('morgan'),
  cors = require('cors'),
  http = require('http'),
  express = require('express'),
  dotenv = require('dotenv'),
  errorhandler = require('errorhandler'),
  bodyParser = require('body-parser'),
  mongoDB = require('./services/mongoUtil');

var app = express();

dotenv.load();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());

if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'));
  app.use(errorhandler());
}

//database
mongoDB.connectDB(err => {
  if (err) {
    console.log('- unable to open connection');
    process.exit();
  } else {
    console.log('- connection opened');

    app.use(require('./routes/user-routes'));
    app.use(require('./routes/pets-routes'));
    app.use(require('./routes/alerts-routes'));
    app.use(require('./routes/services-routes'));
    app.use(require('./routes/sos-routes'));
    app.use(require('./routes/messages-routes'));
  }
});

var port = process.env.PORT || 3001;

app.listen(port, function(err) {
  if (err) {
    console.log(err);
  }
  console.log('listening in http://localhost:' + port);
});

//Socket.io Setup
var io = require('socket.io')(3002);
io.on('connection', socket => {
  console.log('socket io connection..');
  socket.on('join:room', function(data) {
    console.log('joining room ', data);
    socket.join(data);
  });
  socket.on('disconnect', function(data) {
    console.log('disconnecting ...');
  });
  socket.on('message', function(data) {
    //data is the message object
    console.log('sending Message', data);
    io.to(data.sosId).emit('message', data);
  });
});
