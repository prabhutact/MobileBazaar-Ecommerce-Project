const User = require("../../model/userModel");
const { Address } = require("../../model/addressSchema");

const mongoose = require("mongoose");
//const ObjectId = require('mongoose')
const {
  Types: { ObjectId },
} = mongoose;

const addAddress = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findById(user._id);
    res.render("user/addAddress", { userData });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const addAddressPost = async (req, res) => {
  try {
    const userData = req.session.user;
    const id = userData._id;

    const address = new Address({
      userId: id,
      name: req.body.name,
      mobile: req.body.mobile,
      addressLine1: req.body.address1,
      addressLine2: req.body.address2,
      city: req.body.city,
      state: req.body.state,
      pin: req.body.pin,
      is_default: false,
    });

    const addressData = await address.save();
    res.redirect("/addresses");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const manageAddress = async (req, res) => {
  try {
    const user = req.session.user;
    const id = user._id;

    const userAddresses = await Address.find({ userId: id }).lean();

    const userData = await User.findById(id);

    res.render("user/address", {
      userAddress: userAddresses,
      userData: userData,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editAddress = async (req, res) => {
  try {
    const id = req.params.id;

    const address = await Address.findById(id).lean();
    // const addressObject = address.toObject();
    console.log(address);

    res.render("user/editAddress", { address });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editAddressPost = async (req, res) => {
  try {
    const id = req.params.id;

    await Address.findByIdAndUpdate(
      id,
      {
        $set: {
          name: req.body.name,
          mobile: req.body.mobile,
          addressLine1: req.body.address1,
          addressLine2: req.body.address2,
          city: req.body.city,
          state: req.body.state,
          pin: req.body.pin,
        },
      },
      { new: true }
    );

    res.redirect("/addresses");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const deleteAddress = async (req, res) => {
  try {
    const id = req.params.id;
    const ID = new mongoose.Types.ObjectId(id);
    console.log(ID);
    await Address.findByIdAndDelete(id);
    console.log(id);
    res.redirect("/addresses");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  addAddress,
  addAddressPost,
  manageAddress,
  editAddress,
  editAddressPost,
  deleteAddress,
};
