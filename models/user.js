"use strict"

var bcrypt = require("bcrypt");
var salt = bcrypt.genSaltSync(10);

module.exports = function (sequelize, DataTypes){
  var User = sequelize.define('User', {
    username: {
      type:DataTypes.STRING,
      unique: true,
      validate: {
        notEmpty: true,
        len: [6, 20]
      }
    },
    email: { 
      type:DataTypes.STRING,
      unique: true, 
      validate: {
        len: [6, 30]
      }
    },
    passwordDigest: {
      type:DataTypes.STRING,
      validate: {
        notEmpty: true
      }
    }
  },

  {
    instanceMethods: {
      checkPassword: function(password) {
        return bcrypt.compareSync(password, this.passwordDigest);
      }
    },

    classMethods: {
      associate: function(models) {
        this.hasMany(models.Favorite);
      },
      encryptPassword: function(password) {
        console.log(password);
        console.log(salt);
        var hash = bcrypt.hashSync(password, salt);
        return hash;
      },
        createSecure: function(username, email, password) {
        return this.create({
          username: username,
          email: email,
          passwordDigest: this.encryptPassword(password)
        });
      },
      authenticate: function(username, password) {
        return this.find({
          where: {
            username: username,
          }
        }) 
        .then(function(user){
          if (user === null){
            throw new Error("Username does not exist");
          } else if (user.checkPassword(password)){
            return user;
          }

        });
      }

    }
  });
  return User;
};