const Category = require("../../model/categorySchema");
const Product = require("../../model/productSchema");
const User = require("../../model/userSchema");
const mongoose = require("mongoose");
const HttpStatus = require('../../httpStatus');
const { isBlocked } = require("../../middleware/usersAuth");





const getProduct = async (req, res) => {
  try {
    const userData = req.session.user;

    const newProduct = await Product.find()
      .sort({ createdOn: -1 })
      .limit(3)
      .lean();

 
    const loadCatData = await Category.find({isListed: true}).lean();

    res.render("user/shop", {
 
   
      userData,
      loadCatData,
      newProduct,
    });
  } catch (error) {
    console.log(error.message);
    res.status(HttpStatus.InternalServerError).send("Internal Server Error");
  }
};






const searchAndSort = async (req, res) => {
  const { searchQuery, sortOption, categoryFilter, page, limit } = req.body;

  const matchStage = { $match: {isBlocked: false} };
  if (searchQuery) {
    matchStage.$match.name = { $regex: searchQuery, $options: "i" };
  }
  if (categoryFilter) {
    matchStage.$match.category = new mongoose.Types.ObjectId(categoryFilter);
  }

  // Construct the sort stage
  const sortStage = { $sort: {} };
  switch (sortOption) {
    case "priceAsc":
      sortStage.$sort.price = 1;
      break;
    case "priceDesc":
      sortStage.$sort.price = -1;
      break;
    case "nameAsc":
      sortStage.$sort.name = 1;
      break;
    case "nameDesc":
      sortStage.$sort.name = -1;
      break;
    case "newArrivals":
      sortStage.$sort.createdAt = -1;
      break;
    case "popularity":
      sortStage.$sort.popularity = -1;
      break;
    default:
      sortStage.$sort.createdAt = 1;
  }

  const skipStage = { $skip: (page - 1) * limit };
  const limitStage = { $limit: limit };

  const products = await Product.aggregate([
    matchStage, 
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true, 
      },
    },
    {
      $lookup: {
        from: "productoffers",  
        localField: "_id",  
        foreignField: "productId",  
        as: "productOffer",
      },
    },
    {
      $unwind: {
        path: "$productOffer",
        preserveNullAndEmptyArrays: true, 
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        price: 1,
        description: 1,
        stock: 1,
        popularity: 1,
        bestSelling: 1,
        imageUrl: 1,
        category: {
          _id: 1,
          category: 1,
          imageUrl: 1,
          isListed: 1,
          bestSelling: 1,
        },
        productOffer: 1,  
        discountPrice: {
          $cond: {
            if: { $eq: ["$productOffer.currentStatus", true] },  
            then: "$productOffer.discountPrice",  
            else: "$price",  
          },
        },
      },
    },
    sortStage, 
    skipStage, 
    limitStage, 
  ]);
  
  console.log(products);
  

  const totalProducts = await Product.countDocuments(matchStage.$match);

  res.json({ products, totalProducts });
};




module.exports = {
  getProduct,
  searchAndSort
};
