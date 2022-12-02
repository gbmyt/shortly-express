const models = require('../models');
const Promise = require('bluebird');

// access parsed cookies on req obj
// looks up the user data related to that session
// assign obj to a session property on the request that contains relevant user information

// session id
module.exports.createSession = (req, res, next) => {
  console.log('req', req);
  // when no cookies
  if (!req.cookies.shortlyid) { // cookies: {}, Object.keys(req.cookies).length
    // Generate a session with a unique hash
    // use models.Sessions.create() --> Creates a new session. Within this function, a hash is randomly generated.
    console.log('Cookie doesn\'t exist');
    // store it the sessions database
    models.Sessions.create() // Returns a Promise
      .then(result => {
        // console.log('Session Create Result', result);
        // get hash from session mysql table
        return models.Sessions.get({
          id: result.insertId
        });
      }).then(session => {
        // session TextRow {
        //   id: 1,
        //   hash: '',
        //   userId: null
        // }
        // console.log('hash', hash);

        req.session = session;
        //Express.js res.cookie() function is used to set the cookie name to value
        res.cookie('shortlyid', session.hash); // cookies: { shortlyid: '' }
        // console.log('Response Obj', res);
        next();
      });

  } else {
    // when a session already exists
    models.Sessions.get({
      hash: req.cookies.shortlyid
    })
      .then(session => {
        // console.log('Session Get', session);

        if (session) {
          // when sesion exists and valid
          req.session = {
            hash: session.hash,
            userId: session.userId,
            user: session.user
          };
        }
        next();
      }).catch(err => {
        return models.Sessions.create();
      })
      // clears and reassigns a new cookie if there is no session assigned to the cookie
      .then(result => {
        return models.Sessions.get({
          id: result.insertId
        });
      })
      .then(session => {
        res.cookie('shortlyid', session.hash);
        console.log('Invalid cookie');
        next();
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/