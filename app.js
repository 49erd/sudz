var express = require('express'),
	ejs = require('ejs'),
	bodyParser = require('body-parser'),
	sequelize = require('sequelize'),
	methodOverride = require('method-override'),
	bcrypt = require('bcrypt'),
	pg = require('pg'),
	session = require('express-session'),
	request = require('request');

var db = require('./models');

var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');

app.use(session({
  secret: 'super secret thing',
  resave: false,
  saveUninitialized: true
}));

app.use("/", function (req, res, next) {
    req.login = function (user) {
        req.session.userId = user.id;
    };
    
  req.currentUser = function () {
    return db.User.
      find({
        where: {
          id: req.session.userId
       }
      }).
      then(function (user) {
        req.user = user;
        return user;
      })
  };
  
  req.logout = function () {
    req.session.userId = null;
    req.user = null;
  }

  next();
});

app.get('/', function(req,res) {
	res.render('index/index');
});

app.get('/signup', function(req,res) {
	res.render('user/signup');
});

app.post('/signup', function(req,res) {
	console.log("req.body is " + JSON.stringify(req.body));
	var username = req.body.newUsername;
	var email = req.body.newEmail;
	var password = req.body.newPassword;
	console.log("password is" + password);
	db.User.createSecure(username,email,password).then(function(user) {
		req.login(user);
		res.redirect('/profile');
	});
});

app.get('/login', function(req,res) {
	res.render('user/login');
});

app.post('/login', function(req,res) {
	var username = req.body.newUsername;
	var password = req.body.newPassword;
	db.User.authenticate(username, password).then(function(user) {
		req.login(user);
		res.redirect('/profile');
	});
});

app.get('/search', function(req,res) {
	var urlEndpoint = "http://api.brewerydb.com/v2/?key=024d36e33d31c96089654338402722b4?s=";
	var query = req.query.locality;
	request(urlEndpoint + query, function(err, resp, body) {
		if (!err && resp.statusCode === 200) {
			var apiBreweries = JSON.parse(body).Search;
			res.render('breweries/search', {brewery: apiBreweries})
			console.log('It worked!');
		}
	})
	res.render('breweries/search');
})

app.get('/profile', function(req,res) {
	req.currentUser().then(function(user) {
		res.render('user/profile', {user: user});
	});
});

app.put('/profile', function(req,res) {
	var firstName = req.body.firstName;
	var lastName = req.body.lastName;
	var city = req.body.city;
	var state = req.body.state;
	var age = req.body.age;
	req.currentUser().then(function(user) {
		user.updateAttributes({first_name:firstName,last_name:lastName,location_city:city,location_state:state,age:age})
		.then(function(updateUser) {
			res.redirect('/profile');
		});
	});
});

// app.get('/profile/:id/favorites', function(req,res) {
// 	if (currentUser.id === req.params.id) {
// 		var user = currentUser;
// 		res.render('user/favorites', user:user);
// 		};
// 	};
// });

app.listen(3000, function() {
	console.log("Listening...");
});