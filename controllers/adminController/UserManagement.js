const User = require('../../model/userModel')
const fs = require('fs')
const path = require('path')


// Get User Page

const usersPage = async (req, res) => {
    try {
        const users = await User.find({}).lean()        
        res.render('admin/userManagement', { admin: true, users, layout:'adminLayout' })
    } catch (error) {
       console.log(error.message);
        res.status(500).send("Internal Server Error");

    }
}


//Block User

const blockUser = async (req, res) => {
    try {
        const {id} = req.body
        const user = await User.findById(id)
        const newBlock = user.isBlocked

        await User.findByIdAndUpdate(
            id, {
            $set: {
                isBlocked: !newBlock
            }
        })
        res.redirect('/admin/users')
    } catch (error) {
       console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}




module.exports = {
    usersPage,
    blockUser
}