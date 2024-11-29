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



// Edit Product Page
const editProductOfferPage = async(req,res)=>{
    try {
        const {id} = req.params
        const editProductOfferData = await productOffer.findById(id)
        if (!editProductOfferData) {
            return res.status(404).send("Product offer not found.");
        }
        const products = await Product.find().lean();
        console.log(editProductOfferData)
        res.render("admin/editProductOffer", { layout: "adminlayout", editProductOfferData, products })

    } catch (error) {
        console.log(error.message)
        res.status(500).send("Internal Server Error");
    }
}


// Edit Product Offer
const editProductOffer = async (req, res) => {
    try {
        const { offerId, productName, productOfferPercentage, startDate, endDate } = req.body;        
        
        const productOfferData = await productOffer.findById(offerId);
        if (!productOfferData) {
            return res.status(404).send("Product offer not found.");
        }
        
        const product = await Product.findOne({ name: productName });
        if (!product) {
            return res.status(404).send("Product not found.");
        }

        const discount = parseFloat(productOfferPercentage);
        if (isNaN(discount) || discount < 5 || discount > 90) {
            return res.status(400).send("Invalid discount percentage. It should be between 5 and 90.");
        }

        // Update the product offer
        productOfferData.productName = productName;
        productOfferData.productOfferPercentage = discount;
        productOfferData.startDate = new Date(startDate);
        productOfferData.endDate = new Date(endDate);
        
        
        await productOfferData.save();

        // Update the product with the new offer data
        product.productOfferId = productOfferData._id;
        product.productOfferPercentage = discount;
        product.discountedPrice = product.price - (product.price * discount) / 100;

        await product.save();

        console.log("Product offer updated:", product);
        res.redirect("/admin/productOffers");

    } catch (error) {
        console.error('Error editing product offer:', error.message);
        res.status(500).send("Internal Server Error");
    }
};



// Delete Product Offer
const deleteProductOffer = async(req,res)=>{
    try {
        const { id } = req.params
        await productOffer.findByIdAndDelete(id)
        res.status(200).send("Product offer deleted successfully.");
        
    } catch (error) {
        console.log(error.message)
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



// Edit Category Offer Page
const editCategoryOfferPage = async(req,res)=>{
    try {
        const {id} = req.params
        const editCategoryOfferData = await categoryOffer.findById(id)
        if (!editCategoryOfferData) {
            return res.status(404).send("Category offer not found.");
        }
        const category = await Category.find().lean();
        console.log(editCategoryOfferData)
        res.render("admin/editCategoryOffer", { layout: "adminlayout", editCategoryOfferData, category })

    } catch (error) {
        console.log(error.message)
        res.status(500).send("Internal Server Error");
    }
}



const editCategoryOffer = async (req, res) => {
    try {
        const { id } = req.params; 
        const { categoryName, categoryOfferPercentage, categoryOfferStartDate, categoryOfferEndDate } = req.body;   

        const discount = parseFloat(categoryOfferPercentage);
        if (isNaN(discount) || discount < 5 || discount > 90) {
            return res.status(400).send("Invalid discount percentage. It should be between 5 and 90.");
        }
        
        const catOffer = await categoryOffer.findById(id);
        if (!catOffer) {
            return res.status(404).send("Category offer not found.");
        }

        // Update the category offer details
        catOffer.categoryName = categoryName;
        catOffer.categoryOfferPercentage = discount;
        catOffer.startDate = new Date(categoryOfferStartDate);
        catOffer.endDate = new Date(categoryOfferEndDate);
        await catOffer.save();
        console.log("Category Offer Updated:", catOffer);

        // Update all products in the category
        const category = await Category.findOne({ category: categoryName });
        if (!category) {
            return res.status(404).send("Category not found.");
        }

        const productsInCategory = await Product.find({ category: category._id });
        for (const product of productsInCategory) {
            
            const productOffer = await productOffer.findOne({ productId: product._id });

            
            const effectiveDiscount = productOffer? Math.min(discount, productOffer.productOfferPercentage) : discount;

            product.discountedPrice = product.price - (product.price * effectiveDiscount) / 100;
            await product.save();
            console.log(`Updated Product: ${product.name}, Effective Discount: ${effectiveDiscount}%`);
        }
        
        res.redirect("/admin/categoryOffers");
    } catch (error) {
        console.error("Error editing category offer:", error.message);
        res.status(500).send("Internal Server Error");
    }
};




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
    editProductOfferPage,
    editProductOffer,
    deleteProductOffer,
    categoryOfferPage,   
    addCategoryOfferPage,
    addCategoryOffer,
    editCategoryOfferPage,
    editCategoryOffer,
    deleteCategoryOffer
}