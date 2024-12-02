const Product = require("../../model/productModel");
const Category = require("../../model/categoryModel");
const productOffer = require("../../model/proOfferModel");
const formatDate = require("../../helpers/formatDateHelper");
const categoryOffer = require("../../model/catOfferModel")
const moment = require('moment');
const productModel = require("../../model/productModel");





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
            const isActive = data.endDate >= new Date() && data.startDate <= new Date();
            await productOffer.updateOne(
                { _id: data._id},
                {
                    $set:{
                        currentStatus: isActive
                        
                    }
                }
            )
        })
        console.log(productOfferData)

        //sending the formatted date to the page
        productOfferData = productOfferData.map((data) => {
            data.startDate = moment(data.startDate).format("YYYY-MM-DD");
            data.endDate = moment(data.endDate).format("YYYY-MM-DD");
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
// const addProductOffer = async (req, res) => {
//     try {
//         const { productName, productOfferPercentage, startDate, endDate } = req.body;
//         console.log(req.body);

//         const product = await Product.findOne({ name: productName });
//         if (!product) {
//             return res.status(404).send("Product not found.");
//         }

//         const discount = parseFloat(productOfferPercentage);

//         if (isNaN(discount) || discount < 5 || discount > 90) {
//             return res.status(400).send("Invalid discount percentage. It should be between 5 and 90.");
//         }

//         // Determine if the offer is currently active based on the start and end date
//         const isActive = new Date(endDate) >= new Date() && new Date(startDate) <= new Date();
        
//         // Create a new product offer
//         const proOffer = new productOffer({
//             productId: product._id,
//             productName: productName,
//             productOfferPercentage: discount,
//             startDate: new Date(startDate),
//             endDate: new Date(endDate),
//             currentStatus: isActive // Set currentStatus based on active dates
//         });

//         await proOffer.save();
//         console.log("Product offer saved:", proOffer);

//         // Update the product with the new offer details
//         product.productOfferId = proOffer._id;

//         if (isActive) {
//             // Apply the discount to the product
//             product.productOfferPercentage = discount;
//             product.discountedPrice = product.price - (product.price * discount) / 100;
//         } else {
//             // Reset the product's offer details when the offer is not active
//             product.productOfferPercentage = 0; 
//             product.discountedPrice = null; // Explicitly set to null
//         }

//         await product.save();

//         console.log("Product updated with new offer:", product);
//         res.redirect("/admin/productOffers");

//     } catch (error) {
//         console.error('Error adding productOffer:', error.message);
//         res.status(500).send("Internal Server Error");
//     }
// };

const addProductOffer = async (req, res) => {
    try {
        const { productName, productOfferPercentage, startDate, endDate } = req.body;
        console.log(req.body);

        const product = await Product.findOne({ name: productName });
        if (!product) {
            return res.status(404).send("Product not found.");
        }

        // Check if there's already an active offer for this product
        const existingOffer = await productOffer.findOne({
            productId: product._id,
            currentStatus: true
        });

        if (existingOffer) {
            return res.status(400).send("An active product offer already exists for this product.");
        }

        const discount = parseFloat(productOfferPercentage);

        if (isNaN(discount) || discount < 5 || discount > 90) {
            return res.status(400).send("Invalid discount percentage. It should be between 5 and 90.");
        }

        // Determine if the offer is currently active based on the start and end date
        const isActive = new Date(endDate) >= new Date() && new Date(startDate) <= new Date();
        
        // Calculate the discount price
        const discountPrice = product.price - (product.price * discount) / 100;

        // Create a new product offer
        const proOffer = new productOffer({
            productId: product._id,
            productName: productName,
            productOfferPercentage: discount,
            discountPrice: discountPrice,  // Save the calculated discount price
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            currentStatus: isActive // Set currentStatus based on active dates
        });

        await proOffer.save();
        console.log("Product offer saved:", proOffer);

        // Update the product with the new offer ID
        product.productOfferId = proOffer._id;
        await product.save();

        console.log("Product updated with new offer ID:", product);
        res.redirect("/admin/productOffers");

    } catch (error) {
        console.error('Error adding productOffer:', error.message);
        res.status(500).send("Internal Server Error");
    }
};



// Edit Product Page
const editProductOfferPage = async(req,res)=>{
    try {
        const {id} = req.params
        const editProductOfferData = await productOffer.findById(id).lean()
        if (!editProductOfferData) {
            return res.status(404).send("Product offer not found.");
        }
        const products = await Product.find().lean();
        console.log("editProductOfferData =>>>>>>>>>>>>>>.",editProductOfferData)
        let startDate = moment(editProductOfferData.startDate).format('YYYY-MM-DD');
        let endDate = moment(editProductOfferData.endDate).format('YYYY-MM-DD');
        res.render("admin/editProductOffer", { layout: "adminlayout", editProductOfferData,startDate ,endDate, products })

    } catch (error) {
        console.log(error.message)
        res.status(500).send("Internal Server Error");
    }
}


// Edit Product Offer
const editProductOffer = async (req, res) => {
    try {
        const { offerId, productName, productOfferPercentage, startDate, endDate } = req.body;

        // Fetch the product offer data by offerId
        const productOfferData = await productOffer.findById(offerId);
        if (!productOfferData) {
            return res.status(404).send("Product offer not found.");
        }

        // Fetch the product by product name
        const product = await Product.findOne({ name: productName });
        if (!product) {
            return res.status(404).send("Product not found.");
        }

        const discount = parseFloat(productOfferPercentage);
        if (isNaN(discount) || discount < 5 || discount > 90) {
            return res.status(400).send("Invalid discount percentage. It should be between 5 and 90.");
        }

        // Check for any other active product offer for the same product, excluding the current one
        const existingActiveOffer = await productOffer.findOne({
            productId: product._id,
            _id: { $ne: offerId }, // Exclude the current offer being edited
            currentStatus: true
        });

        if (existingActiveOffer) {
            return res.status(400).send("An active product offer already exists for this product.");
        }

        // Determine if the offer is active based on the start and end date
        const isActive = new Date(endDate) >= new Date() && new Date(startDate) <= new Date();

        // Calculate the new discount price
        const discountPrice = product.price - (product.price * discount) / 100;

        // Update the product offer data
        productOfferData.productName = productName;
        productOfferData.productOfferPercentage = discount;
        productOfferData.discountPrice = discountPrice; // Save the discount price in the product offer
        productOfferData.startDate = new Date(startDate);
        productOfferData.endDate = new Date(endDate);
        productOfferData.currentStatus = isActive; // Set the status of the offer based on dates

        await productOfferData.save();

        console.log(`Product offer updated successfully for product: ${product.name}`);
        res.redirect("/admin/productOffers");

    } catch (error) {
        console.error("Error editing product offer:", error.message);
        res.status(500).send("Internal Server Error");
    }
};






// Delete Product Offer
// const deleteProductOffer = async(req,res)=>{
//     try {
//         const { id } = req.params
//         await productOffer.findByIdAndDelete(id)
//         res.status(200).send("Product offer deleted successfully.");
        
//     } catch (error) {
//         console.log(error.message)
//         res.status(500).send("Internal Server Error");
//     }
    
// }    

const deleteProductOffer = async (req, res) => {
    try {
        const { id } = req.params;
        
       

        
        await productOffer.findByIdAndDelete(id);

        
        res.status(200).send("Product offer deleted and price reset successfully.");
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
};


// Category Offer Page
const categoryOfferPage = async (req,res)=>{
    try {
        var page = 1
        if(req.query.page){
            page = req.query.page
        }
        let limit = 2       
        let categoryOffers = await categoryOffer.find().skip((page-1)*limit).limit(limit*1).lean()
        const count = await categoryOffer.find({}).countDocuments();
        const totalPages = Math.ceil(count / limit);
        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

        categoryOffers.forEach(async (data)=>{
            const isActive = data.endDate >= new Date() && data.startDate <= new Date();
            await categoryOffer.updateOne(
                { _id: data._id},
                {
                    $set:{
                        currentStatus: isActive
                        
                    }
                }
            )
        })
        

        categoryOffers = categoryOffers.map((data)=> {
            data.startDate = moment(data.startDate).format('YYYY-MM-DD');
            data.endDate = moment(data.endDate).format('YYYY-MM-DD')
            return data
        })
        
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





const addCategoryOffer = async (req, res) => {
    try {
        const { categoryName, categoryOfferPercentage, categoryOfferStartDate, categoryOfferEndDate } = req.body;

        // Fetch the category from the Category collection using the category name
        const category = await Category.findOne({ category: categoryName });
        if (!category) {
            return res.status(404).send("Category not found.");
        }

        // Check if an active offer already exists for the same category
        const existingOffer = await categoryOffer.findOne({
            categoryId: category._id,
            currentStatus: true
        });

        if (existingOffer) {
            return res.status(400).send("An active category offer already exists for this category.");
        }

        const discount = parseFloat(categoryOfferPercentage);

        // Validate the discount percentage
        if (isNaN(discount) || discount < 5 || discount > 90) {
            return res.status(400).send("Invalid category discount percentage. It should be between 5 and 90.");
        }


        const catOffer = new categoryOffer({
            categoryName,
            categoryId: category._id,  // Assign the category's _id as a reference
            categoryOfferPercentage: discount,
            //categoryDiscountPrice,  // Save the calculated category discount price
            startDate: new Date(categoryOfferStartDate),
            endDate: new Date(categoryOfferEndDate),
            currentStatus: new Date(categoryOfferEndDate) >= new Date() && new Date(categoryOfferStartDate) <= new Date() // Set status based on dates
        });

        // Save the category offer
        await catOffer.save();
        console.log("Category Offer saved:", catOffer);

        // Fetch all products in this category
        const productsInCategory = await Product.find({ category: category._id });

        for (const product of productsInCategory) {
            // Check if there's an existing product offer for this product
            const existingProductOffer = await productOffer.findOne({ productId: product._id });

            if (existingProductOffer) {
                // Always update the product offer with the category discount
                existingProductOffer.productOfferPercentage = discount;

                // Recalculate the discount price based on the category discount
                existingProductOffer.discountPrice = product.price - (product.price * discount) / 100;

                // Update the start and end dates to match the category offer
                existingProductOffer.startDate = new Date(categoryOfferStartDate);
                existingProductOffer.endDate = new Date(categoryOfferEndDate);

                // Set the current status based on the active dates
                existingProductOffer.currentStatus =
                    new Date(categoryOfferEndDate) >= new Date() &&
                    new Date(categoryOfferStartDate) <= new Date();

                // Save the updated product offer
                await existingProductOffer.save();
            } else {
                // Create a new product offer if none exists
                const newProductOffer = new productOffer({
                    productId: product._id,
                    productName: product.name,
                    productOfferPercentage: discount,
                    discountPrice: product.price - (product.price * discount) / 100,
                    startDate: new Date(categoryOfferStartDate),
                    endDate: new Date(categoryOfferEndDate),
                    currentStatus:
                        new Date(categoryOfferEndDate) >= new Date() &&
                        new Date(categoryOfferStartDate) <= new Date()
                });

                await newProductOffer.save();
            }

            console.log(`Updated product offer for product: ${product.name}`);
        }

        res.redirect("/admin/categoryOffers");

    } catch (error) {
        console.error("Error adding category offer:", error.message);
        res.status(500).send("Internal Server Error");
    }
};





// Edit Category Offer Page
const editCategoryOfferPage = async(req,res)=>{
    try {
        const {id} = req.params
        const editCategoryOfferData = await categoryOffer.findById(id).lean()
        if (!editCategoryOfferData) {
            return res.status(404).send("Category offer not found.");
        }
        const category = await Category.find().lean();
        console.log(editCategoryOfferData)

        let startDate = moment(editCategoryOfferData.startDate).format('YYYY-MM-DD');
        let endDate = moment(editCategoryOfferData.endDate).format('YYYY-MM-DD');

        res.render("admin/editCategoryOffer", { layout: "adminlayout", editCategoryOfferData, startDate , endDate, category })

    } catch (error) {
        console.log(error.message)
        res.status(500).send("Internal Server Error");
    }
}



const editCategoryOffer = async (req, res) => {
    try {
        const { id } = req.params; // Category offer ID
        const { categoryName, categoryOfferPercentage, categoryOfferStartDate, categoryOfferEndDate } = req.body;

        // Parse and validate the discount percentage
        const discount = parseFloat(categoryOfferPercentage);
        if (isNaN(discount) || discount < 5 || discount > 90) {
            return res.status(400).send("Invalid discount percentage. It should be between 5 and 90.");
        }

        // Fetch the category offer by ID
        const catOffer = await categoryOffer.findById(id);
        if (!catOffer) {
            return res.status(404).send("Category offer not found.");
        }

        // Fetch the category by name
        const category = await Category.findOne({ category: categoryName });
        if (!category) {
            return res.status(404).send("Category not found.");
        }

        // Update the category offer details
        catOffer.categoryName = categoryName;
        catOffer.categoryOfferPercentage = discount;
        catOffer.startDate = new Date(categoryOfferStartDate);
        catOffer.endDate = new Date(categoryOfferEndDate);
        catOffer.currentStatus =
            new Date(categoryOfferEndDate) >= new Date() && new Date(categoryOfferStartDate) <= new Date();
        await catOffer.save();
        console.log("Category Offer Updated:", catOffer);

        // Fetch all products in this category
        const productsInCategory = await Product.find({ category: category._id });

        for (const product of productsInCategory) {
            // Check if there's an existing product offer for this product
            const existingProductOffer = await productOffer.findOne({ productId: product._id });

            if (existingProductOffer) {
                // Always update the product offer with the category discount
                existingProductOffer.productOfferPercentage = discount;

                // Recalculate the discount price based on the category discount
                existingProductOffer.discountPrice = product.price - (product.price * discount) / 100;

                // Update the start and end dates to match the category offer
                existingProductOffer.startDate = new Date(categoryOfferStartDate);
                existingProductOffer.endDate = new Date(categoryOfferEndDate);

                // Set the current status based on the active dates
                existingProductOffer.currentStatus =
                    new Date(categoryOfferEndDate) >= new Date() &&
                    new Date(categoryOfferStartDate) <= new Date();

                // Save the updated product offer
                await existingProductOffer.save();
            } else {
                // Create a new product offer if none exists
                const newProductOffer = new productOffer({
                    productId: product._id,
                    productName: product.name,
                    productOfferPercentage: discount,
                    discountPrice: product.price - (product.price * discount) / 100,
                    startDate: new Date(categoryOfferStartDate),
                    endDate: new Date(categoryOfferEndDate),
                    currentStatus:
                        new Date(categoryOfferEndDate) >= new Date() &&
                        new Date(categoryOfferStartDate) <= new Date()
                });

                await newProductOffer.save();
            }

            // Update the product's discounted price directly
         
    
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