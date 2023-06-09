// write a middleware function that will access the cookies on an incoming request, parse them into an object, and assign this object to a cookies property on the request.
const parseCookies = (req, res, next) => {
  req.cookies = req.cookies || {};
  // parse req.headers.cookie, and then write parsed obj to req.cookies
  let cookie = req.headers.cookie;
  // cookie: 'shortlyid=...'
  if (cookie) { // cookie: {} <--- no shortlyid property / undefined
    cookie.split('; ')
      .map(cookie => {
        return cookie.split('=');
      })
      .forEach(field => req.cookies[field[0]] = field[1]);
  } else {
    // req.cookies = {}; // this line is imortant, otherwise test cannot read property
    console.log('No cookies found');
  }
  next();
};

// array {
//   shortlyid:
//   otherCookie:
//   anotherCookie:
// }

module.exports = parseCookies;