// write a middleware function that will access the cookies on an incoming request, parse them into an object, and assign this object to a cookies property on the request.
const parseCookies = (req, res, next) => {

  // parse req.headers.cookie, and then write parsed obj to req.cookies
  let cookie = req.headers.cookie;
  if (cookie) {
    console.log('Cookie string', req.headers.cookie);
    cookie.split('; ')
      .map(cookie => {
        return cookie.split('=');
      })
      .forEach(field => req.cookies[field[0]] = field[1]);

    console.log('split array', req.cookies);
    next();
  } else {
    console.log('No cookies found');
    next();
  }
};

module.exports = parseCookies;