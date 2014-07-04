var request = require('request');;
var querystring = require('querystring');
var credentials = require('./credentials/spotify');

const CLIENT_ID = credentials.CLIENT_ID,
      CLIENT_SECRET = credentials.CLIENT_SECRET,
      REDIRECT_URI = credentials.REDIRECT_URI;

var states = {};

function generateId() {
  const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  var id = [CHARS.charAt(Math.floor(Math.random() * 52))];

  for (var i = 1; i < 16; ++i) {
    id.push(CHARS.charAt(Math.floor(Math.random() * CHARS.length)));
  }

  return id.join('');
}

function registerLoginResource(app) {
  var state;
  
  do {
    state = generateId();
  } while (states[state]);

  states[state] = true;

  app.get('/login', function(req, res) {
    // Request authorization
    var params = querystring.stringify({
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      scope: 'playlist-read-private playlist-modify-private',
      state: state
    });

    res.redirect('https://accounts.spotify.com/authorize?' + params);
  });
}

function registerCallbackResource(app) {
  app.get('/callback', function(req, res) {
    // Check for valid state
    var state = req.query.state;
    
    if (!states[state]) {
      res.redirect('/');
      return;
    }

    delete states[state];

    // Check for error
    var error = req.query.error;
    
    if (error) {
      res.redirect('/#' + querystring.stringify({ error: error }));
      return;
    }

    // Request access token
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: req.query.code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      },
      json: true
    };
    
    request.post(authOptions, function(error, response, body) {
      if (error) {
        res.redirect('/#' + querystring.stringify({ error: error }));
        return;
      }

      if (response.statusCode !== 200) {
        res.redirect('/#' + querystring.stringify({ error: "Received HTTP status code " + response.statusCode }));
        return;
      }

      // Pass tokens to the browser
      res.redirect('/#' +
        querystring.stringify({
          accessToken: body.access_token,
          expiresIn: body.expires_in,
          refreshToken: body.refresh_token
        }));
    });
  });
}

function registerRefreshResource(app) {
  app.get('/refresh_token', function(req, res) {
    // Refresh access token
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: { Authorization: 'Basic ' + (new Buffer(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')) },
      form: {
        grant_type: 'refresh_token',
        refresh_token: req.query.refresh_token
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (error) {
        res.redirect('/#' + querystring.stringify({ error: error }));
        return;
      }

      if (response.statusCode !== 200) {
        res.redirect('/#' + querystring.stringify({ error: "Received HTTP status code " + response.statusCode }));
        return;
      }

      res.send({ 'access_token': body.access_token });
    });
  });
}

exports.register = function(app, proxy) {
  if (proxy) {
    request = require('request').defaults({ proxy: proxy });
  }
  
  registerLoginResource(app);
  registerCallbackResource(app)
  registerRefreshResource(app);
}
