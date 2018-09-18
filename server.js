var logger = require('morgan'),
  cors = require('cors'),
  http = require('http'),
  express = require('express'),
  dotenv = require('dotenv'),
  errorhandler = require('errorhandler'),
  bodyParser = require('body-parser'),
  mongoDB = require('./mongoUtil');

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

    app.use(require('./user-routes'));
  }
});

var port = process.env.PORT || 3001;

app.listen(port, function(err) {
  console.log('listening in http://localhost:' + port);
});
