const Category = require("../../model/categoryModel");
const Product = require("../../model/productModel");
const User = require("../../model/userModel");
const { Address } = require("../../model/addressSchema");
const userHelper = require("../../helpers/user.helper");

const mongoose = require("mongoose");
//const ObjectId = require('mongoose')
const {
  Types: { ObjectId },
} = mongoose;

const viewUserProfile = async (req, res) => {
  try {
    const user = req.session.user;
    const id = user._id;
    const userData = await User.findById(id);
    const userDataObject = userData.toObject();
    res.render("user/profile", { userData: userDataObject });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const EditUserProfile = async (req, res) => {
  try {
    const user = req.session.user;
    const id = user._id;
    const userData = await User.findById(id);
    const userDataObject = userData.toObject();
    console.log(userData);
    res.render("user/editProfile", { userData: userDataObject });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const image = req.file;
    let imageFileName;
    if (req.file) {
      imageFileName = req.file.filename;
    } else {
      imageFileName = req.session.user.image;
    }

    const id = req.params.id;

    await User.findByIdAndUpdate(
      id,
      {
        $set: {
          name: req.body.name,
          mobile: req.body.mobile,
          /*email: req.body.email*/
          image: imageFileName,
        },
      },
      { new: true }
    );

    res.redirect("/profile");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const changePassword = async (req, res) => {
  try {
    const user = req.session.user;
    const id = user._id;
    const userData = await User.findById(id);

    res.render("user/changePassword", { userData });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const updatePassword = async (req, res) => {
  try {
    const { oldPass, newPass } = req.body;
    const userId = req.session.user;
    const findUser = await User.findOne({ _id: userId }).lean();
    const passwordMatch = await userHelper.hashPassword(oldPass);

    if (passwordMatch) {
      const saltRounds = 10;
      const hashedPassword = await userHelper.hashPassword(newPass);
      console.log("Hashed Password:", hashedPassword);
      await User.updateOne(
        { _id: userId },
        {
          $set: {
            password: hashedPassword,
          },
        }
      );
      console.log("Password changed successfully.");
      res.json({ status: true });
    } else {
      console.log("Old password does not match.");
      res.json({ status: false });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  viewUserProfile,
  EditUserProfile,
  updateUserProfile,
  changePassword,
  updatePassword,
};
