// call the following middlewares:
var express = require('express'),
	ejs = require('ejs'),
	bodyParser = require('body-parser'),
	sequelize = require('sequelize'),
	methodOverride = require('method-override'),
	bcrypt = require('bcrypt'),
	pg = require('pg'),
	session = require('express-session'),
	request = require('request');

// create a variable defined by the environmental variable for the API key
var apiKey = process.env.API_KEY;

// require that models define the databases
var db = require('./models');

// use express, body parser, method override middleware, use ejs views
var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
// allows you to use edit and delete modules
app.use(methodOverride("_method"));

// use static file for css styling
app.use(express.static(__dirname + '/public'));

// use session middleware, allowing cookies to be created and one user to remain logged in while navigating the site
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
  // function for logging out of a user's session
  req.logout = function () {
    req.session.userId = null;
    req.user = null;
  }

// for testing purposes, keep the following user signed in indefinitely
// req.session.userId=1;

// move on to the next middleware
  next();
});

// render the home page
app.get('/', function(req,res) {
	res.render('index/index', {userId: req.session.userId});
});

// allow users to login on the homepage
// app.post('/', function(req,res) {
// 	var username = req.body.newUsername;
// 	var password = req.body.newPassword;
// 	db.User.authenticate(username, password).then(function(user) {
// 		req.login(user);
// 		res.redirect('/profile');
// 	});
// });

// render the about page
app.get('/about', function(req,res) {
	res.render('index/about', {userId: req.session.userId});
});

// render the contact page
app.get('/contact', function(req,res) {
	res.render('index/contact', {userId: req.session.userId});
});

// render the signup page
app.get('/signup', function(req,res) {
	res.render('user/signup');
});

// submit info to sign up
app.post('/signup', function(req,res) {
	console.log("req.body is " + JSON.stringify(req.body));
	var username = req.body.newUsername;
	var email = req.body.newEmail;
	var password = req.body.newPassword;
	var firstName = req.body.newFirstName;
	var lastName = req.body.newLastName;
	var age = req.body.newAge;
	// create a user by first putting parameters into the createSecure function (encrypts password)
	db.User.createSecure(username,email,password).then(function(user) {
		// log in the newly created user
		req.login(user);
		// go to the new user's profile
		res.redirect('/profile');
	});
});

// render the login page
app.get('/login', function(req,res) {
	res.render('user/login');
});

// submit info to User database
app.post('/login', function(req,res) {
	var username = req.body.newUsername;
	var password = req.body.newPassword;
	//authenticate the information provided to match it with the info in the User database
	db.User.authenticate(username, password).then(function(user) {
		// log in the user
		req.login(user);
		// redirect to the user's profile page
		res.redirect('/profile');
	});
});

app.get('/search', function(req,res) {
	var name = req.query.name;
	// if nothing has been input into the search bar, do this stuff
	if (!name) {
		res.render('breweries/search', {breweries: [], noBreweries: false, userId: req.session.userId, results: false})
	} else {
		// call the API and look for the entry that corresponds to the name inputted in the search box
		var urlBdb = "http://api.brewerydb.com/v2/search?q="+name+"&type=brewery&key="+apiKey;
		request(urlBdb, function(err, resp, body) {
			// if there are no errors and the status code is 200 (ok), do this stuff
			if (!err && resp.statusCode === 200) {
				var site = JSON.parse(body).data;
				// if there are results from the search, do this stuff
				if (site) {
						res.render('breweries/search', {breweries: site, noBreweries: false, userId: req.session.userId, results: true});
				// if there are no results, do this stuff
				} else {
					res.render('breweries/search', {breweries: [], noBreweries: true, userId: req.session.userId, results: true});
				}
			}
		});
	}
});

app.get('/profile', function(req,res) {
	// look for the current user's session
	req.currentUser().then(function(user) {
		// if there is a current user, show them their profile page
		if (user) {
			res.render('user/profile', {user: user});
			// if for some reason someone types in /profile to the url and there is no current user, take them to the login page
		} else {
			res.redirect('/login');
		}
	});
});

app.post('/profile', function(req,res) {
	// if someone presses the logout button, log them out with the logout function defined above in the app.use 'session' section
	req.logout();
	res.redirect('/');
});

// app.get('/edit', function(req,res) {
// 	// find and render the information about the current user
// 	db.User.findAll({where: {UserId: req.session.userId}}).then(function(user) {
// 		res.render('edit', {firstName:user.first_name, lastName: user.last_name, age: user.age});
// 	});
// });

// app.put('/edit', function(req,res) {
// 	var firstName = req.body.firstName;
// 	var lastName = req.body.lastName;
// 	var city = req.body.city;
// 	var state = req.body.state;
// 	var age = req.body.age;
// 	req.currentUser().then(function(user) {
// 		user.updateAttributes({first_name:firstName,last_name:lastName,location_city:city,location_state:state,age:age})
// 		.then(function(updateUser) {
// 			res.redirect('/profile');
// 		});
// 	});
// });

app.get('/breweries/:id', function(req,res) {
	var brewId = req.params.id;
	var endpointDesc = "http://api.brewerydb.com/v2/brewery/"+brewId+"/?key="+apiKey;
	// call the API to get information about the brewery you're searching for
	request(endpointDesc, function(err, resp, body) {
		//if no error and status code is "ok", do this stuff
		if (!err && resp.statusCode === 200) {
			var apiDesc = JSON.parse(body).data;
			// if there is a description, display it
			if (apiDesc.description) {
				db.Favorite.findAll({where: {UserId: req.session.userId, breweryId: brewId}}).then(function(site) {
					res.render('breweries/breweries', {brewery: apiDesc, brewId: brewId, noDescription: false, userId: req.session.userId});
				});
				// if there's no description, noDescription is false, which renders a "no description" text on the page
			} else {
				db.Favorite.findAll({where: {UserId: req.session.userId, breweryId: brewId}}).then(function(site) {
					res.render('breweries/breweries', {brewery: apiDesc, brewId: brewId, noDescription: true, userId: req.session.userId});
				});
			}
		}
	});
});

// action to be taken when someone hits the "add ot favorites" button
app.post('/favorites', function(req,res) {
	// define variable for the information found on the page from the API
	var brewery = req.body.brewery;
	// look to see if the brewery already exists in the favorites list
	var user = req.session.userId;
	if (user) {
		db.Favorite.findAll({where: {UserId: req.session.userId, breweryId: brewery.breweryId}}).then(function(site) {
			// if it doesn't, add it
			if (site.length < 1) {
				db.Favorite.create({UserId: req.session.userId, name: brewery.name, breweryId: brewery.breweryId}).then(function(beer) {
				res.redirect('/favorites');
				});
			// if it exists in the favorites database, don't add, but take user to their favorites
			} else {
			res.redirect('/favorites');
			}
		});
	} else {
		res.redirect('/login');
	}
});

// delete stuff
app.delete('/favorites/:breweryId', function(req,res) {
	// find the current user
	var user = req.session.userId;
	var brewery = req.params.breweryId;
	console.log("brewery is " + brewery)
	// find in the favorites database where the brewery ID is the one you want to delete, and associated with the current user
	db.Favorite.find({where: {UserId: user,breweryId: brewery}})
	.then(function(entry) {
			entry.destroy().then(function(page) {
				res.redirect('/favorites');
			});
		});
});

app.get('/favorites', function(req,res) {
	// check to see if there's a logged in user.  If there is, do this stuff
	if (req.session.userId) {
		// find all the favorites associated with the current user's Id
		db.Favorite.findAll({where: {UserId: req.session.userId}})
		.then(function(favorites) {
			res.render('user/favorites', {favorites: favorites});
		});
		// if there's no logged in user, go to the login page
	} else {
		res.redirect('/login');
	}
});

app.listen((process.env.PORT || 3000), function() {
	console.log("Listening...");
});