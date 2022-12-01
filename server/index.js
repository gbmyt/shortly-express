const app = require('./app.js');
const db = require('./db');
const port = 3000; // change the port of the live-server to make it different from test server

app.listen(port, () => {
  console.log(`Shortly is listening on ${port}`);
});
