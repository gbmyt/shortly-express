// write a middleware function that will access the cookies on an incoming request, parse them into an object, and assign this object to a cookies property on the request.
const parseCookies = (req, res, next) => {

  // parse req.headers.cookie, and then write parsed obj to req.cookies
  if (req.headers.cookie) {
    console.log('Cookie string', req.headers.cookie);
  } else {
    console.log('No cookies found');
    next();
  }
  // cookies: {
  // shortlyid: '18ea4fb6ab3178092ce936c591ddbb90c99c9f66;'
  // }
  // console.log('parseCookies req', req);
};

module.exports = parseCookies;