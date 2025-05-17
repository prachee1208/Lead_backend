var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  // res.render('index', { title: 'Express' });
  res.send("Welcome to Lead Management API")
});

// Removed duplicate signup and login routes that were conflicting with the main API

module.exports = router;
