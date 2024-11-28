const Product = require("../../model/productModel");
const Category = require("../../model/categoryModel");
const productOffer = require("../../model/proOfferModel");
const formatDate = require("../../helpers/formatDateHelper");
const categoryOffer = require("../../model/catOfferModel")


// Product Offer Page
const productOfferPage = async (req,res)=>{
    try {
        var page = 1
        if(req.query.page){
            page = req.query.page
        }
        let limit = 3        
        let productOfferData = await productOffer.find().skip((page-1)*limit).limit(limit*1).lean()        
        const count = await productOffer.find({}).countDocuments();
        const totalPages = Math.ceil(count / limit);
        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

        // updating the currentStatus field by checking with the current date
        productOfferData.forEach(async (data)=>{
            await productOffer.updateOne(
                { _id: data._id},
                {
                    $set:{
                        currentStatus:
                        data.endDate >= new Date() && data.startDate <=new Date(),
                    }
                }
            )
        })
        console.log(productOfferData)

        //sending the formatted date to the page
        productOfferData = productOfferData.map((data) => {
            data.startDateFormatted = formatDate(data.startDate, "YYYY-MM-DD");
            data.endDateFormatted = formatDate(data.endDate, "YYYY-MM-DD");
            return data;
          });
          console.log(productOfferData)

        const categoryOffers = await categoryOffer.find().lean()
        console.log(categoryOffers)
        
        res.render("admin/productOffer", { layout: "adminlayout", productOfferData, pages });
    } catch (error) {
        console.log(error)
    }
}


// Add Product Offer Page
const addProductOfferPage = async (req,res)=>{
    try {        
        const products = await Product.find({}).lean()
        res.render("admin/addProductOffer", { layout: "adminlayout", products });
    } catch (error) {
        console.log(error)
    }
}



// Add Product Offer
const addProductOffer = async (req,res)=>{
    try {
        const {productName,productOfferPercentage,startDate,endDate} = req.body
        console.log(req.body)
        const product = await Product.findOne({name:productName})
        const discount = parseFloat(productOfferPercentage)
        if (isNaN(discount) || discount < 5 || discount > 90) {
            return res.status(400).send("Invalid discount percentage. It should be between 5 and 90.");
        }
        const proOffer = new productOffer({
            productId: product._id,
            productName:productName,
            productOfferPercentage: discount,
            startDate: new Date(startDate),
            endDate: new Date(endDate)

        })
        await proOffer.save()
        console.log(proOffer)
        product.productOfferId = proOffer._id;
        product.productOfferPercentage = discount;    
        product.discountedPrice = product.price - (product.price * discount) / 100;    
        await product.save();
        console.log("Product updated with new offer:", product);
        res.redirect("/admin/productOffers")
    } catch (error) {
        console.error('Error adding productOffer:', error.message);
      res.status(500).send("Internal Server Error");
    }
}



// Category Offer Page
const categoryOfferPage = async (req,res)=>{
    try {
        var page = 1
        if(req.query.page){
            page = req.query.page
        }
        let limit = 2       
        const categoryOffers = await categoryOffer.find().skip((page-1)*limit).limit(limit*1).lean()
        const count = await categoryOffer.find({}).countDocuments();
        const totalPages = Math.ceil(count / limit);
        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
        console.log(categoryOffers)
        
        res.render("admin/categoryOffer", { layout: "adminlayout", categoryOffers, pages  });
    } catch (error) {
        console.log(error)
    }
}



// Add Category Offer Page
const addCategoryOfferPage = async (req,res)=>{
    try {
        const category = await Category.find({}).lean()
        res.render("admin/addCategoryOffer", { layout: "adminlayout", category });
    } catch (error) {
        console.log(error)
    }
}



// Add Category Offer
const addCategoryOffer = async (req,res)=>{
    try {
        const {categoryName,categoryOfferPercentage,categoryOfferStartDate,categoryOfferEndDate} = req.body
        console.log(req.body)
        const category = await Category.find({category: categoryName})
        const discount = parseFloat(categoryOfferPercentage);        
        const catOffer = new categoryOffer({            
            categoryName,
            categoryOfferPercentage:discount,
            startDate:new Date(categoryOfferStartDate),
            endDate:new Date(categoryOfferEndDate)

        })
        await catOffer.save()
        console.log(catOffer)
        const productsInCategory = await Product.find({ category: category._id });
        for (const product of productsInCategory) {
            const productOffer = await productOffer.findOne({ productId: product._id });
            const effectiveDiscount = productOffer? Math.min(discount, productOffer.productOfferPercentage): discount;
            product.discountedPrice = product.price - (product.price * effectiveDiscount) / 100;
            await product.save();
            console.log(`Updated Product: ${product.name}, Effective Discount: ${effectiveDiscount}%`);
        }

        res.redirect("/admin/categoryOffers")
    } catch (error) {
        console.error('Error adding categoryOffer:', error.message);
      res.status(500).send("Internal Server Error");
    }
}



// Delete Category Offer
const deleteCategoryOffer = async(req,res)=>{
    try {
        const { id } = req.params
        await categoryOffer.findByIdAndDelete(id)
        res.status(200).send("Category offer deleted successfully.");
        
    } catch (error) {
        console.log(error.message)
        res.status(500).send("Internal Server Error");
    }
    
}    



module.exports = {
    productOfferPage,
    addProductOfferPage,
    addProductOffer,
    categoryOfferPage,   
    addCategoryOfferPage,
    addCategoryOffer,
    deleteCategoryOffer
}