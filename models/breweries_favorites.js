"use strict";
module.exports = function(sequelize, DataTypes) {
  var breweries_favorites = sequelize.define("breweries_favorites", {
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    website: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return breweries_favorites;
};