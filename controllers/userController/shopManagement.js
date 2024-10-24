const Category = require("../../model/categoryModel")
const Product = require("../../model/productModel")
const User = require('../../model/userModel')
const mongoose = require('mongoose')


const getShopPage = (req, res) => {
  try {
    res.render('user/shop')
  } catch (error) {
    console.log(error.message);
      res.status(500).send("Internal Server Error");;
  }
}


module.exports = {
  getShopPage
}