const Cart = require("../../model/cartModel");
const Product = require("../../model/productModel");
const Category = require("../../model/categoryModel");
const User = require("../../model/userModel");
const { Address } = require("../../model/addressSchema");
const Order = require("../../model/orderModel");
const Coupon=require('../../model/couponSchema')

const mongoose = require("mongoose");
const ObjectId = require("mongoose");

const loadCheckoutPage = async (req, res) => {
  try {
    let userData = await User.findById(req.session.user._id).lean();
    const ID = new mongoose.Types.ObjectId(userData._id);

    const addressData = await Address.find({ userId: userData._id }).lean();
    let coupon= await Coupon.find().lean()
    

    const subTotal = await Cart.aggregate([
      {
        $match: {
          userId: ID,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$value" },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
        },
      },
    ]);
    let cart = await Cart.aggregate([
      {
        $match: {
          userId: ID,
        },
      },
      {
        $lookup: {
          from: "products",
          foreignField: "_id",
          localField: "product_Id",
          as: "productData",
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          quantity: 1,
          value: 1,
          productName: { $arrayElemAt: ["$productData.name", 0] },
          productPrice: { $arrayElemAt: ["$productData.price", 0] },
          productDescription: { $arrayElemAt: ["$productData.description", 0] },
          productImage: { $arrayElemAt: ["$productData.imageUrl", 0] },
        },
      },
    ]);
    console.log(cart);
    

    res.render("user/checkout", {
      userData,
      addressData,
      subTotal: subTotal[0].total,
      cart,
      coupon
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const placeorder = async (req, res) => {
  try {
    userData = req.session.user;
    const ID = new mongoose.Types.ObjectId(userData._id);
    const addressId = req.body.selectedAddress;
    const payMethod = req.body.selectedPayment;
    const totalamount = req.body.amount;
    console.log(addressId, payMethod, totalamount);

    const result = Math.random().toString(36).substring(2, 7);
    const id = Math.floor(100000 + Math.random() * 900000);
    const ordeId = result + id;

    // const productInCart = await Cart.aggregate([
    //   {
    //     $match: {
    //       userId: ID,
    //     },
    //   },

    //   {
    //     $lookup: {
    //       from: "products",
    //       foreignField: "_id",
    //       localField: "product_Id",
    //       as: "productData",
    //     },
    //   },
    //   {
    //     $project: {
    //       product_Id: 1,
    //       userId: 1,
    //       quantity: 1,
    //       value: 1,
    //       name: { $arrayElemAt: ["$productData.name", 0] },
    //       price: { $arrayElemAt: ["$productData.price", 0] },
    //       productDescription: { $arrayElemAt: ["$productData.description", 0] },
    //       image: { $arrayElemAt: ["$productData.imageUrl", 0] },
    //     },
    //   },
    // ]);

    const SampproductInCart = await Cart.aggregate([
      {
        $match: {
          userId: ID,
        },
      },
      {
        $lookup: {
          from: "products",
          foreignField: "_id",
          localField: "product_Id",
          as: "productData",
        },
      },
      {
        $project: {
          product_Id: 1,
          userId: 1,
          quantity: 1,
          value: 1,
          productName: { $arrayElemAt: ["$productData.name", 0] },
          productPrice: { $arrayElemAt: ["$productData.price", 0] },
          productDescription: { $arrayElemAt: ["$productData.description", 0] },
          productImage: { $arrayElemAt: ["$productData.imageUrl", 0] },
        },
      },
    ]);
    let productDet = SampproductInCart.map((item) => {
      return {
        _id: item.product_Id,
        name: item.productName,
        price: item.productPrice,
        quantity: item.quantity,
        image: item.productImage[0],
      };
    });
    console.log(productInCart, "aggregated cart prods");
    console.log(productDet, "aggregated cart prods");

    console.log(SampproductInCart, "aggregated cart prods");
    console.log(productDet, " 11111111111 aggregated cart prods");

    let saveOrder = async () => {

      if (req.body.couponData) {
      const order = new Order({
        userId: ID,
        product: productDet,
        address: addressId,
        orderId: ordeId,
        total: totalamount + 50,
        paymentMethod: payMethod,
        discountAmt: req.body.couponData.discountAmt,
        amountAfterDscnt: req.body.couponData.newTotal+50,
        coupon: req.body.couponName,
        couponUsed: true
      });

      const ordered = await order.save()
      console.log(ordered, "ordersaved DATAAAA with coupon")
        
      } else {
        const order = new Order({
            userId: ID,
            product: productDet,
            address: addressId,
            orderId: ordeId,
            total: totalamount+50,
            paymentMethod: payMethod,
        })

        const ordered = await order.save()
        console.log(ordered, "ordersaved DATAAAA")

    }

      productDet.forEach(async (product) => {
        await Product.updateMany(
          { _id: product._id },
          { $inc: { stock: -product.quantity } }
        );
      });

      productDet.forEach(async (product) => {
        const populatedProd= await Product.findById(product._id).populate("category").lean()
        await Category.updateMany({ _id: populatedProd.category._id });

    })

      const deletedCart = await Cart.deleteMany({
        userId: ID,
      }).lean();
      console.log(deletedCart, "deletedCart");
      //res.redirect('/orderPlaced')
      return ordered;
    };

    if (addressId) {
      if (payMethod === "cash-on-delivery") {
        const isPlaced = await saveOrder();
        if (isPlaced) {
          res.json({
            // CODsuccess: true,
            COD: true,
            //ordered
          });
        } else {
          return res.json({
            COD: false,
          });
        }
      }

      if (payMethod === 'razorpay') {

        const amount = req.body.amount 

        let instance = new Razorpay({
            key_id: "rzp_test_OsDtnewxAfAwm0",
            key_secret: "DMYU2HQhHPmK1pRRsRklpioi"

        })
        const order = await instance.orders.create({
            amount: amount * 100 ,
            currency: 'INR',
            receipt: 'Harish',

        })
        await saveOrder()

        res.json({
            razorPaySucess: true,
            order,
            amount,
        })
    }

    /// payment method wallet function


    if (payMethod === 'wallet') {
        const newWallet = req.body.updateWallet
        const userData = req.session.user


        await User.findByIdAndUpdate(userData._id, { $set: { wallet: newWallet+50 } }, { new: true })


        await saveOrder()
        if (req.body.couponData) {
            await User.updateOne(
                { _id: req.session.user._id },
                {
                    $push: {
                        history: {
                            amount: req.body.couponData.newTotal +50,
                            status: 'debited',
                            date: Date.now()
                        }
                    }
                }
            );

        } else {
            await User.updateOne(
                { _id: req.session.user._id },
                {
                    $push: {
                        history: {
                            amount: totalamount,
                            status: 'debited',
                            date: Date.now()
                        }
                    }
                }
            );

        }


        res.json({
            walletSucess: true,
        })
    }
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const orderSuccess = async (req, res) => {
  try {
    res.render("user/orderPlaced", {
      title: "Order Placed",
      userData,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


const validateCoupon = async (req, res) => {
  try {
      const { couponVal, subTotal } = req.body;
      console.log(couponVal, subTotal)
      const coupon = await Coupon.findOne({ code: couponVal });

      if (!coupon) {
          res.json('invalid');
      } else if (coupon.expiryDate < new Date()) {
          res.json('expired');
      }else if (subTotal < coupon.minPurchase) {
          res.json('Minimum Amount Required');
      } else {
          const couponId = coupon._id;
          const discount = coupon.discount;
          const userId = req.session.user._id;

          const isCpnAlredyUsed = await Coupon.findOne({ _id: couponId, usedBy: { $in: [userId] } });

          if (isCpnAlredyUsed) {
              res.json('already used');
          } else {
              //await Coupon.updateOne({ _id: couponId }, { $push: { usedBy: userId } });

              const discnt = Number(discount);
              const discountAmt = (subTotal * discnt) / 100;
              const newTotal = subTotal - discountAmt;

              const user = User.findById(userId);

              res.json({
                  discountAmt,
                  newTotal,
                  discount,
                  succes: 'succes'
              });
          }
      }
  } catch (error) {
      console.log(error);
  }
};
const applyCoupon = async (req, res) => {
  try {
      const { couponVal, subTotal } = req.body;
      const coupon = await Coupon.findOne({ code: couponVal });
      const userId = req.session.user._id;

      if (!coupon) {
          return res.json({ status: 'invalid' });
      } else if (coupon.expiryDate < new Date()) {
          return res.json({ status: 'expired' });
      } else if (coupon.usedBy.includes(userId)) {
          return res.json({ status: 'already_used' });
      } else if (subTotal < coupon.minPurchase) {
          return res.json({ status: 'min_purchase_not_met' });
      } else {
          // Add user ID to usedBy array
          await Coupon.updateOne({ _id: coupon._id }, { $push: { usedBy: userId } });

          // Calculate the new total by subtracting the discount amount
          let discountAmt = (subTotal * coupon.discount) / 100;
          if (discountAmt > coupon.maxDiscount) {
              discountAmt = coupon.maxDiscount;
          }
          const newTotal = subTotal - discountAmt;

          return res.json({
              discountAmt,
              newTotal,
              discount: coupon.discount,
            status: 'applied',
            couponVal
          });
      }
  } catch (error) {
      console.log(error);
      res.status(500).json({ status: 'error', error });
  }
};


const removeCoupon = async (req, res) => {
  try {
      const { couponVal, subTotal } = req.body;
      const coupon = await Coupon.findOne({ code: couponVal });
      const userId = req.session.user._id;

      if (!coupon) {
          return res.json({ status: 'invalid' });
      } else if (!coupon.usedBy.includes(userId)) {
          return res.json({ status: 'not_used' });
      } else {
          // Remove user ID from usedBy array
          await Coupon.updateOne({ _id: coupon._id }, { $pull: { usedBy: userId } });

          // Calculate the new total by adding back the discount amount correctly
          const discountAmt = 0;
          const newTotal = subTotal;

          return res.json({
              discountAmt,
              newTotal,
              discount: coupon.discount,
            status: 'removed',
            couponVal
          });
      }
  } catch (error) {
      console.log(error);
      res.status(500).json({ status: 'error', error });
  }
};

module.exports = {
  loadCheckoutPage,
  placeorder,
  orderSuccess,
  validateCoupon,
  applyCoupon,
  removeCoupon
};
