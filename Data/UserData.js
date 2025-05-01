const express = require('express')
const UserSchema = require('../Schema/UserSchema')
const router = express.Router()
const jwt = require('jsonwebtoken')
const FetchUser = require('../Middleware/FetchUser')
const AdminSchema = require('../Schema/AdminSchema')
// ! ROUTER 1 FOR USER SIGNUP
router.post('/user_signup', async (req, res) => {
    let success = true
    let admin = await AdminSchema.findOne()
    let member = await UserSchema.findOne({ email: req.body.email })
    const date=new Date()
    if (member) {
        success=false
        return res.status(400).json({ success, member, errors: "Already exist"});
    }
    member = await UserSchema.create({
        AdminId: admin._id,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        time:date
    })
    const data = {
        member: {
            id: member.id

        }
    }
    const getuser=await UserSchema.findById(data.member.id)
    // const jwt_Sign = "Sachin_Saxena"
    // const jwttoken = jwt.sign(data, jwt_Sign)
    success = true
    return res.status(200).json({ success, message: "Thank you",getuser})
})

//? ROUTER 2 FOR USER LOGIN
router.post('/user_login', async (req, res) => {
    const { email } = req.query
    try {
        let member = await UserSchema.findOne({ email })
        if (!member) {
            return res.status(500).json({ success, error: "Incorrect information" })
        }
        const payload = {
            member: {
                id: member.id
            }
        }
        const jwt_Sign = "Sachin_Saxena"
        const authtoken = jwt.sign(payload, jwt_Sign)
        res.json({ success: true, authtoken })
    } catch (error) {
        res.status(500).json(error)
    }
})
// ROUTER 3 FOR GETTING MEMBER DATA
router.get('/get_USERdata', async (req, res) => {
    try {
        let success=false
        const userId =req.headers.id;
        const admin = await UserSchema.findById(userId).select('-__v')
        success=true
        res.status(200).json({success,admin})
    } catch (error) {
        // console.log(error)
        res.status(500).send("Some Error Occurred")
    }
})
router.get('/getAll_User', async (req, res) => {
    let success = false
    const user = await UserSchema.find()
    if (!user) {
        return res.status(404).json(success)
    }
    success = true
    return res.status(200).json({ success, user })
})


module.exports = router