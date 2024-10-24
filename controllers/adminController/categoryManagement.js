const Category = require("../../model/categoryModel");
const fs = require('fs')
const path = require('path')



// Get Category Page

const showCategoryPage = async (req, res) => {
  try {
    const category = await Category.find({}).lean();    
    res.render("admin/show_category", {   category, layout: "adminlayout" });
  } catch (error) {}
};


// Get Add Category Page
 
const addCategoryPage = (req, res) => {
  try {
    let catExistMsg = "Category alredy Exist..!!";
    let catSaveMsg = "Category added suceessfully..!!";

    if (req.session.catSave) {
      res.render("admin/add_category", { catSaveMsg, layout: "adminlayout" });
      req.session.catSave = false;
    } else if (req.session.catExist) {
      res.render("admin/add_category", { catExistMsg, layout: "adminlayout" });
      req.session.catExist = false;
    } else {
      res.render("admin/add_category", { layout: "adminlayout" });
    }
  } catch (error) {
    console.log(error);
  }
};



// Add New Category

const addNewCategory = async (req, res) => {
  const catName = req.body.name;
  const image = req.file;

  try {
    const catExist = await Category.findOne({
      category: { $regex: new RegExp("^" + catName + "$", "i") },
    });
    if (!catExist) {
      const category = new Category({
        category: catName,
        imageUrl: image.filename,
      });

      await category.save();
      req.session.catSave = true;
      res.redirect("/admin/addCategory");
    } else {
      req.session.catExist = true;
      res.redirect("/admin/addCategory");
    }
  } catch (error) {}
};


// Unlist Category

const unListCategory = async (req, res) => {
  try {
      const {id} = req.body
      let category = await Category.findById(id)
      let newListed = category.isListed

    await Category.findByIdAndUpdate(id, { $set: {isListed: !newListed}}, { new: true })
      res.redirect('/admin/category')
  } catch (error) {
     console.log(error.message);
      res.status(500).send("Internal Server Error");

  }
}


//Get Edit Category Page

const showEditCategory = async (req, res) => {
  try {
    const categoryId = req.params.id
    const category = await Category.findById(categoryId).lean()
    res.render('admin/editCategory', { layout: "adminlayout", category })
  } catch (error) {
    
  }
}


// Update Category

const updateCategory = async (req, res) => {
  try { 
    
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);

    if (!category) {
      console.error('Category not found');
      return res.status(404).send('Category not found');
    }

    const newCategoryName = req.body.name; 
    const image = req.file; 
    let updImage;
    
    if (image) {
      updImage = image.filename; 
      console.log('Uploaded image:', updImage);
    } else {
      updImage = category.imageUrl; 
    }
    
    const categoryExist = await Category.findOne({
      category: { $regex: new RegExp(`^${newCategoryName}$`, 'i') },
      _id: { $ne: categoryId } 
    });

    if (categoryExist) {
      req.session.catExist = true; 
      return res.redirect(`/admin/editCategory/${categoryId}`); 
    }
  
    await Category.findByIdAndUpdate(
      categoryId,
      {
        category: newCategoryName, 
        imageUrl: updImage, 
      },
      { new: true }
    );

    req.session.categoryUpdate = true; 
    res.redirect("/admin/category");

  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).send('Internal Server Error');
  }
};



module.exports = {

  addCategoryPage,
  addNewCategory,
  showCategoryPage,  
  unListCategory,
  showEditCategory,
  updateCategory
  
};
