const express = require('express');
const path = require('path');
// const Auth = require('./middleware/auth');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const models = require('./models');
const app = express();

const Auth = require('./middleware/auth');
const cookieParser = require('./middleware/cookieParser');

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(express.static(path.join(__dirname, '../public')));

//using app.use to mount middleware functions in Express js
// need to require first
app.use(cookieParser);
app.use(Auth.createSession);

// Add a verifySession helper function to all server routes
const verifySession = (req, res, next) => {
  // console.log('Is Logged In?', models.Sessions.isLoggedIn(req.session));
  console.log('Verify Session Log', req.session);

  // Determines if a session is associated with a logged in user.
  if (models.Sessions.isLoggedIn(req.session)) {
    // if logged in
    console.log('You are already logged in');
    // console.log('Is logged in', req.session);
    // res.redirect('/');
    next();
  } else {
    // if not logged in, redirect to login
    // verify session
    // console.log('REQUEST SESSION LOG', req.session);
    console.log('Not logged in');
    res.redirect('/login');
  }
};

// ATTEMPTING TO IMPLEMENT VERIFYSESSION HERE
app.get('/', verifySession, (req, res) => {
  res.render('index');
});
// app.get('/', (req, res) => {
//   verifySession(req, res, () => {
//     res.render('index');
//   });
// });

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/create', (req, res) => {
  verifySession(req, res, () => {
    res.render('index');
  });
});

// app.get('/', (req, res) => {
//   var isLoggedIn = verifySession(req, res, () => {

//   });

//   // <-- if true, allow them to access '/', else if not logged in we'll redirect them to the login page '/login'
//   if (isLoggedIn) {
//     res.render('index');
//   } else {
//     console.log('inside app.get else block ');
//     res.render('login');
//   }
// });

// app.get('/', (req, res) => {
//   res.render('index');
// });


// app.get('/create', (req, res) => {
//   res.render('index');
// });

app.get('/links',
  (req, res, next) => {
    verifySession(req, res, () => {
      models.Links.getAll()
        .then(links => {
          res.status(200).send(links);
        })
        .error(error => {
          res.status(500).send(error);
        });
    });
  });


app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
      // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({
          id: results.insertId
        });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/

//add post routes

app.post('/signup', (req, res, next) => {

  let newUser = {
    username: req.body.username,
    password: req.body.password
  };

  return models.Users.get(req.body.username)
    .then(result => {
      console.log('CREATE result', result);

      // Handle user already exists case
      if (result) {
        res.redirect('/signup');
      } else {
        // If sign up attempt is legit, create new user record => users table
        return models.Users.create(newUser)
          .then((user) => {
            // console.log('User Created', user);
            // res.cookie('shortlyid', req.session.hash);
            // console.log('Signup Method Req Obj', req);

            res.redirect('/');
            // Request obj has our hash stored on it, use that info to update our Sessions record with userId
            return models.Sessions.update({
              hash: req.session.hash
            }, {
              userId: user.insertId
            });
          });
      }
    }).catch(() => {
      res.redirect('/signup');
    });
});

app.post('/login', (req, res, next) => {
  return models.Users.get({
    username: req.body.username
  }).then((user) => {
    // models.Users.compare(attempted, password, salt) → {boolean}
    // Compares a password attempt with the previously stored password and salt.

    // user will look like:
    // {
    //   id: 1,
    //   username: 'Samantha',
    //   password: '44f813e460b6cbd1a98763edfe4a179a27bfb0d033c388dd7598b79f03920fa8',
    //   salt: '83afaafa1a6c53752c73e65f39579602103e0ce58936825e9d837d2284b3512b'
    // }

    if (models.Users.compare(req.body.password, user.password, user.salt)) {
      // add the user info to the session

      // console.log('POST LOGIN', req.session);
      models.Sessions.update({
        hash: req.session.hash
      }, {
        userId: user.id
      }); // This doesn't work, Hashes Dont Match

      // for sucessful login, redirect to index page
      res.redirect('/');
    } else {
      // for failed login, redirect to login page
      res.redirect('/login');
    }
  }).catch(err => {
    // console.log('Caught login Error: ', err);
    res.redirect('/login');
  });
});

// if user makes a request to logout
// get session from sessions table and delete it
// empty sessions/cookie object on our request
app.get('/logout', (req, res, next) => {
  // console.log('==> Request Logout');

  return models.Sessions.delete({
      hash: req.session.hash
    })
    .then(() => {
      res.status(200).clearCookie('shortlyid');
      res.redirect('/');
    })
    .catch(err => {
      res.status(400).send(err);
    });

  // cookies: { 'shortlyId': '' }
  // models.Sessions.create();
});

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {
  // console.log('Response Obj SHORTCODE', res.request); // 2387f

  return models.Links.get({
      code: req.params.code
    })
    .tap(link => {
      if (!link) {
        // res.request.href = '/';
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({
        linkId: link.id
      });
    })
    .tap(link => {
      return models.Links.update(link, {
        visits: link.visits + 1
      });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;