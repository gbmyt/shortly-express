const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const Auth = require('./middleware/auth');
const models = require('./models');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(express.static(path.join(__dirname, '../public')));



app.get('/',
  (req, res) => {
    res.render('index');
  });

app.get('/create',
  (req, res) => {
    res.render('index');
  });

app.get('/links',
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
      // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({
      url
    })
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

  return models.Users.create(newUser)
    .then(ResultSetHeader => {
      // console.log('sign up user exists', ResultSetHeader);
      res.redirect('/');
    }).catch(err => {
      // console.log('Caught Error: ', err);
      res.redirect('/signup'); // change to login eventually
    });
});

app.post('/login', (req, res, next) => {
  // console.log('post login', req.body);

  return models.Users.get({
    username: req.body.username
  }).then((user) => {
    // models.Users.compare(attempted, password, salt) → {boolean}
    // Compares a password attempt with the previously stored password and salt.

    // console.log('user undef?', user);

    // user will look like:
    // {
    //   id: 1,
    //   username: 'Samantha',
    //   password: '44f813e460b6cbd1a98763edfe4a179a27bfb0d033c388dd7598b79f03920fa8',
    //   salt: '83afaafa1a6c53752c73e65f39579602103e0ce58936825e9d837d2284b3512b'
    // }

    if (models.Users.compare(req.body.password, user.password, user.salt)) {
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




/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({
    code: req.params.code
  })
    .tap(link => {

      if (!link) {
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
    .then(({
      url
    }) => {
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