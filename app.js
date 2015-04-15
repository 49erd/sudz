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

app.post('/', function(req,res) {
	var username = req.body.newUsername;
	var password = req.body.newPassword;
	db.User.authenticate(username, password).then(function(user) {
		req.login(user);
		res.redirect('/profile');
	});
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
	var name = req.query.name;
	if (!name) {
		res.render('breweries/search', {breweries: [], noBreweries: false})
	} else {
		var urlBdb = "http://api.brewerydb.com/v2/search?q="+name+"&type=brewery&key=024d36e33d31c96089654338402722b4";
		request(urlBdb, function(err, resp, body) {
			if (!err && resp.statusCode === 200) {
				var site = JSON.parse(body).data;
				console.log(site);
				if (site) {
					res.render('breweries/search', {breweries: site, noBreweries: false});

				} else {
					res.render('breweries/search', {breweries: [], noBreweries: true});
				}
			}
		});
	}
});

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

app.get('/breweries/:id', function(req,res) {
	var brewId = req.params.id;
	var endpointDesc = "http://api.brewerydb.com/v2/brewery/"+brewId+"/?key=024d36e33d31c96089654338402722b4";
	request(endpointDesc, function(err, resp, body) {
		if (!err && resp.statusCode === 200) {
			var apiDesc = JSON.parse(body).data;
			res.render('breweries/breweries', {brewery: apiDesc})
		}
	});
});

app.post('/breweries/:id', function(req,res) {
	var brewId = req.params.id;
	var userId = req.currentUser().id;
	var endpointDesc = "http://api.brewerydb.com/v2/brewery/"+brewId+"/?key=024d36e33d31c96089654338402722b4";
	request(endpointDesc, function(err, resp, body) {
		if (!err && resp.statusCode === 200) {
			var apiDesc = JSON.parse(body).data;
			db.Favorite.create({UserId: userId, breweryId: apiDesc.id, name: apiDesc.name}).then(function(redirect) {
				(res.redirect('/favorites'));
			});
		}
	});
});
// 	var brewId = req.params.id;
// 	var endpointDesc = "http://api.brewerydb.com/v2/brewery/"+brewId+"/?key=024d36e33d31c96089654338402722b4";
// 	request(endpointDesc, function(err, resp, body) {
// 		if (!err && resp.statusCode === 200) {
// 			var apiDesc = JSON.parse(body).data;
// 			db.Favorite.create({user_id: currentUser.id, name: apiDesc.name}).then(function(redirecting) {
// 				res.redirect('/favorites');
// 			});
// 		}
// 	});
// });
	// request(endpointLoc, function(err, resp, body) {
	// 	if (!err && resp.statusCode === 200) {
	// 		console.log(JSON.parse(body));
	// 		var apiLoc = JSON.parse(body).data[0];
	// 		res.render('breweries/breweries', {breweryLoc: apiLoc})
	// 	}
// 	});
// });

app.get('/favorites', function(req,res) {
	var currentUser = req.currentUser();
	if (currentUser) {
		db.favorite.find({where: {UserId: currentUser.id}
	})
		.then(function(user) {
			res.render('user/favorites', {user: user});
	})
	} else {
		res.redirect('/login');
	}
});

// app.get('/profile/bucketlist', function(req,res) {
// 	currentUser.
// 		var user = currentUser;
// 		res.render('user/favorites', user:user);
// 		};
// 	};
// });

app.listen(3000, function() {
	console.log("Listening...");
});