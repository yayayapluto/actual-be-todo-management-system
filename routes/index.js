var express = require('express');
var router = express.Router();


// Welcome Page

router.get('/', (req, res) => {
  res.send('Selamat Datang\n Rest CRUD API with Node.js, Express, and Postgres API');
});

module.exports = router;    