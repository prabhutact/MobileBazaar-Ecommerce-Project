const Category = require("../../model/categoryModel");
const Product = require("../../model/productModel");
const User = require("../../model/userModel");
const { Address } = require("../../model/addressSchema");
const userHelper = require("../../helpers/user.helper");
const Cart = require("../../model/cartModel");
const Wishlist = require('../../model/wishlistSchema')
const Order = require("../../model/orderModel");
const argon2 = require("argon2");

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
    const passwordMatch = await argon2.verify(findUser.password, oldPass);

    if (passwordMatch) {
      //const saltRounds = 10;
      const hashedPassword = await argon2.hash(newPass)
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


const my_Orders = async (req, res) => {
  try {
    const user = req.session.user;
    const id = user._id;
    const userData = await User.findById(id).lean();
    // const userDataObject = userData.toObject();
    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    let limit = 5;
    const skip = (page - 1) * limit;

    console.log(userData, "userdata");

    const myOrders = await Order.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $project: {
          _id: 1,
          date: 1,
          orderId: 1,
          status: 1,
          amountAfterDscnt: 1,
          total: 1,
        },
      },
      {
        $sort: {
          date: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);
    const count = await Order.find({}).countDocuments();
    const totalPages = Math.ceil(count / limit);
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    console.log(myOrders, "myOrders");
    res.render("user/myOrders", {
      userData: userData,
      myOrders,
      pages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const orderDetails = async (req, res) => {
  try {
      let ct = 0
      let ct2 = 0
      const orderId = req.params.id;
      const user = req.session.user;
      const userId = user._id;
      let offerprice=0



      // Retrieve user data
      const userData = await User.findById(userId).lean();

      // Retrieve order details including populated address
      const myOrderDetails = await Order.findById(orderId).populate('address').lean();
      // let hasReturnedItems = myOrderDetails.product.some(product => product.isReturned);
      // let allCancelled = myOrderDetails.product.every(product => product.isCancelled);
      // let allReturned = myOrderDetails.product.every(product => product.isReturned);
      await myOrderDetails.product.forEach((product) => {
          if (product.isReturned) {
              ct++
          }
          if (product.isCancelled) ct2++
          offerprice+= product.price* product.quantity
      })
      let check = function (a, b) {
          if (a + b === myOrderDetails.product.length) {
              return true
          } else {
              return false
          }
      }

      if (check(ct, ct2) && ct>0  && myOrderDetails.status !== "Returned") {
          await Order.findByIdAndUpdate(myOrderDetails._id, { $set: { status: 'Returned' } }, { new: true });
          myOrderDetails.status = "Returned";
      }else{
          if(check(ct2,ct) && ct2>0 && myOrderDetails.status !== "Cancelled" &&  myOrderDetails.status !== "Returned"){
              await Order.findByIdAndUpdate(myOrderDetails._id, { $set: { status: 'Cancelled' } }, { new: true });
              myOrderDetails.status = "Cancelled";
          }
      }

     // myOrderDetails.allCancelled = allCancelled;
     // myOrderDetails.allReturned = allReturned;

      if (!myOrderDetails) {
          return res.status(404).send("Order not found");
      }

      // Retrieve ordered product details
      const orderedProDet = await Order.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(orderId) } },
          { $unwind: "$product" },
          {
              $project: {
                  _id: 1,
                  product: 1
              }
          }
      ]);
      const address=await Address.findOne(
          {
              userId:userId
          }
      ).lean()
      console.log(address,"address")

      console.log("myOrderDetails:", myOrderDetails);
      //console.log("orderedProDet:", orderedProDet);
      offerprice-=(myOrderDetails.total)

      res.render('user/orderDetails', {offerprice, address,orderedProDet, myOrderDetails, userData });
  } catch (error) {
      console.error("Error fetching order details:", error.message);
      res.status(500).send("Internal Server Error");
  }
};


const verify = (req, res) => {
  console.log(req.body.payment, "end");
  const { orderId } = req.body
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body.payment
  let hmac = crypto.createHmac("sha256", process.env.KEY_SECRET);
  hmac.update(
      `${razorpay_order_id}|${razorpay_payment_id}`
  );
  hmac = hmac.digest("hex");
  console.log(hmac, "HMAC");
  console.log(razorpay_signature, "signature");
  if (hmac === razorpay_signature) {
      console.log("true");
      changeOrderStatusToConfirmed(orderId)
      res.json({ status: true });
  } else {
      console.log("false");
      res.json({ status: false });
  }
};


const walletpage = async (req, res) => {
  try {
      const user = req.session.user;
      const id = user._id;
      const userData = await User.findById(id).lean();


      console.log(userData);

      var page = 1;
      if (req.query.page) {
          page = req.query.page;
      }
      let limit = 5;
      const skip = (page - 1) * limit;

      const historyData = await User.aggregate([
          {
              $match: {
                  _id: userData._id
              }
          },
          {
              $project: {
                  _id: 0,
                  history: 1
              }
          },
          {
              $unwind: "$history"
          },
          {
              $sort: { "history.date": -1 } // Sort the history array by date in descending order
          },
          {
              $group: {
                  _id: "$_id",
                  history: { $push: "$history" }
              }
          },
          {
              $project: {
                  history: { $slice: ["$history", skip, limit] }
              }
          }
      ]);

      const count = await User.aggregate([
          { $match: { _id: userData._id } },
        { $project: { historyCount: { $size: { $ifNull: ["$history", []] } } } }
      ]);

      const totalItems = count[0] ? count[0].historyCount : 0;
      const totalPages = Math.ceil(totalItems / limit);
      const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

      const history = historyData[0] ? historyData[0].history : [];

      console.log(history);

      res.render('user/wallet', { userData, history, pages });

  } catch (error) {
    console.log(error.message);
    console.log(error.message);
      res.status(500).send("Internal Server Error");
  }
}


const retryPayment = async(req, res) =>{
  try {

    const id = req.params.id
    console.log("retry pymenyyyyyytt" , id )
    await Order.findByIdAndUpdate(id, { $set: { status: 'pending' } }, { new: true });

      res.json({
          razorPaySucess: true,
          order
      })
    
  } catch (error) {
    
  }
 }

module.exports = {
  viewUserProfile,
  EditUserProfile,
  updateUserProfile,
  changePassword,
  updatePassword,
  my_Orders,
  orderDetails,
  verify,
  walletpage,
  retryPayment
};
