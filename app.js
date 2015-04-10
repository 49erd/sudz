var express = require('express'),
	ejs = require('ejs'),
	bodyParser = require('body-parser'),
	sequelize = require('sequelize'),
	methodOverride = require('method-override'),
	bcrypt = require('bcrypt'),
	pg = require('pg'),
	session = require('express-session');

var db = require('./models');

var app = express();

app.set('view engine', 'ejs');

app.get('/', function(req,res) {
	res.render('user/index');
});

app.get('/signup', function(req,res) {
	res.render('user/signup');
});

app.post('/signup', function(req,res) {
	db.User.createSecure(user.username, user.email, user.password).then(function(user) {
		req.login(user);
		res.redirect('/profile');
	});
});

app.get('/login', function(req,res) {
	res.render('user/login');
});

app.post('login', function(req,res) {
	var user = req.body.user;
	db.User.authenticate(user.username, user.password).then(function(user) {
		req.login(user);
		res.redirect('/profile');
	});
});

app.get('profile', function(req,res) {
	req.currentUser().then(function(user) {
		res.render('user/profile', {user: user});
	});
});

app.listen(3000, function() {
	console.log("Listening...");
});