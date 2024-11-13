const express = require('express')
const router = express.Router()
const { getLogin, doLogin, doLogout } = require("../controllers/adminController/adminController")
const { showProduct, addProductPage, addProduct, blockProduct, showeditProduct, updateProduct, deleteProdImage } = require('../controllers/adminController/productManagement');
const { addCategoryPage, addNewCategory, showCategoryPage, unListCategory, showEditCategory, updateCategory } = require('../controllers/adminController/categoryManagement');
const { usersPage, blockUser } = require('../controllers/adminController/UserManagement');
const { ordersPage, orderDetails, changeStatus } = require('../controllers/adminController/ordersManagement');
const { couponPage, addCouponPage, addCouponPost, editCouponPage, editCouponPost, deleteCoupon } = require('../controllers/adminController/couponManagement');
const {  loadDashboard, getSales, getChartData }=require('../controllers/adminController/dashBoardManagement')
const { isLogin, isLogout } = require("../middleware/adminAuth")
const store = require('../middleware/multer')

// Admin Login & Logout

router.get("/admin/login", isLogout , getLogin)
router.post("/admin/login" , isLogout, doLogin)
router.get("/admin/logout",  doLogout)

router.get('/admin/home', isLogin, loadDashboard)
//router.get("/admin/home",isLogin , getHome)

// Product Page

router.get('/admin/product',  showProduct)
router.get('/admin/addProduct', isLogin ,  addProductPage)
router.post('/admin/addProduct', isLogin, store.array('image', 5), addProduct)
router.put('/admin/blockProduct', isLogin, blockProduct)
router.post('/admin/unlistCategory', isLogin, unListCategory)
router.get('/admin/editProduct/:id', isLogin, showeditProduct)
router.post('/admin/updateProduct/:id', isLogin, store.array('image', 5), updateProduct)
router.delete('/admin/product_img_delete', isLogin, deleteProdImage)


// Category Page

router.get('/admin/addCategory',isLogin  , addCategoryPage)
router.post('/admin/addCategory', isLogin , store.single('image'), addNewCategory)
router.get('/admin/category',  isLogin, showCategoryPage)
router.get('/admin/editCategory/:id',  showEditCategory)
router.post('/admin/updateCategory/:id' , store.single('image') , updateCategory )


// Users Page

router.get('/admin/users', isLogin, usersPage) 
router.put('/admin/blockuser', isLogin, blockUser)


// Orders Page 

router.get('/admin/orders', isLogin, ordersPage)
router.get('/admin/order_details/:id', isLogin, orderDetails)
router.post('/admin/change_status/:id', isLogin, changeStatus)


// coupon
router.get('/admin/coupons',isLogin,couponPage)
router.get('/admin/addcoupon',isLogin,addCouponPage)
router.post('/admin/add_coupon', isLogin, addCouponPost)
router.get('/admin/editcoupon/:id', editCouponPage);
router.post('/admin/editcoupon/:id', editCouponPost);
router.delete('/admin/delete_coupon',isLogin,deleteCoupon)

// Chart
router.get('/get_sales',isLogin, getSales)
router.get('/get_chart_data',isLogin, getChartData)



module.exports = router


