const Coupon=require('../../model/couponSchema')




const couponPage= async(req,res)=>{
    try {
        const couponData = await Coupon.find().lean();
        console.log(couponData);

       // const now = moment();
    
        // const couponData = coupon.map((cpn) => {
        //   const formattedDate = moment(cpn.expiryDate).format("MMMM D, YYYY");
    
        //   return {
        //     ...cpn,
        //     expiryDate: formattedDate,
        //   };
        // });
    
    
        res.render('admin/coupon',{couponData, title:"Admin",layout:'adminlayout'})
    } catch (error) {

        console.log(error.message);
        res.status(500).send("Internal Server Error");
        
    }
}

const addCouponPage= async(req,res)=>{
    const couponMsg = "Coupon added successfuly..!!";
    const couponExMsg = "Coupon alredy exist..!!";

    try {
        if (req.session.couponMsg) {
            res.render("admin/addCoupon",{  couponMsg ,title:"Admin",layout:'adminlayout'});
            req.session.couponMsg = false;
          } else if (req.session.couponExMsg) {
            
            res.render("admin/addCoupon", { couponExMsg ,title:"Admin",layout:'adminlayout'});
            req.session.couponExMsg = false;
          } else {
            res.render("admin/addCoupon",{ title:"Admin",layout:'adminlayout'});
          }
    } catch (error) {

        console.log(error.message);
        res.status(500).send("Internal Server Error");
        
    }
}
const addCouponPost = async (req, res) => {
  try {
      const { code, percent, expDate, maxDiscount, minPurchase } = req.body;


      console.log('Received data:', req.body);

   
      if (!code || !percent || !expDate || !maxDiscount || !minPurchase) {
          throw new Error('All fields are required');
      }

      const discount = parseFloat(percent);
      const minPurchaseAmount = parseFloat(minPurchase);
      const maxDiscountAmount = parseFloat(maxDiscount);

      if (isNaN(discount) || discount <= 0 || discount > 100) {
          throw new Error('Invalid discount value');
      }
      if (isNaN(minPurchaseAmount) || minPurchaseAmount < 0) {
          throw new Error('Invalid minimum purchase amount');
      }
      if (isNaN(maxDiscountAmount) || maxDiscountAmount < 0) {
          throw new Error('Invalid maximum discount amount');
      }

      const cpnExist = await Coupon.findOne({ code: code });

      if (!cpnExist) {
          const coupon = new Coupon({
              code: code,
              discount: discount,
              expiryDate: new Date(expDate),
              minPurchase: minPurchaseAmount,
              maxDiscount: maxDiscountAmount
          });

          await coupon.save();
          req.session.couponMsg = 'Coupon added successfully';
          res.redirect("/admin/addcoupon");
      } else {
          req.session.couponExMsg = 'Coupon already exists';
          res.redirect("/admin/addcoupon");
      }
  } catch (error) {
      console.error('Error adding coupon:', error.message);
      res.status(500).send("Internal Server Error");
  }
};


  const deleteCoupon= async(req,res)=>{
    try {

        const {id}=req.body
        await Coupon.findByIdAndDelete(id)
        
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");

        
    }
  }
module.exports={
    couponPage,
    addCouponPage,
    addCouponPost,
    deleteCoupon
}