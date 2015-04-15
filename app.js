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

  req.session.userId=1;

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
			console.log(apiDesc);
			res.render('breweries/breweries', {brewery: apiDesc, brewId: brewId})
		}
	});
});

app.post('/favorites', function(req,res) {
	var brewery = req.body.brewery;
	db.Favorite.findAll({where: {UserId: req.session.userId, breweryId: brewery.breweryId}}).then(function(site) {
		console.log("result is " + site)
		if (site.length === 0) {
			db.Favorite.create({UserId: req.session.userId, name: brewery.name, breweryId: brewery.breweryId}).then(function(beer) {
				res.redirect('/favorites');
			});
		}
	});
});
// 	var brewId = req.params.id;
// 	var userId = req.currentUser().id;
// 	var endpointDesc = "http://api.brewerydb.com/v2/brewery/"+brewId+"/?key=024d36e33d31c96089654338402722b4";
// 	request(endpointDesc, function(err, resp, body) {
// 		if (!err && resp.statusCode === 200) {
// 			var apiDesc = JSON.parse(body).data;
// 			db.Favorite.create({UserId: userId, breweryId: apiDesc.id, name: apiDesc.name}).then(function(redirect) {
// 				(res.redirect('/favorites'));
// 			});
// 		}
// 	});

app.get('/favorites', function(req,res) {
	if (req.session.userId) {
		db.Favorite.findAll({where: {UserId: req.session.userId}})
		.then(function(favorites) {

			console.log("\n\n\n\n\n\nThe favorites were:", favorites);
			res.render('user/favorites', {favorites: favorites});
		});
	} else {
		res.redirect('/login');
	}
});

app.listen((process.env.PORT || 3000), function() {
	console.log("Listening...");
});