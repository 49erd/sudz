"use strict";
module.exports = function(sequelize, DataTypes) {
  var breweries_wishlist = sequelize.define("breweries_wishlist", {
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
  return breweries_wishlist;
};