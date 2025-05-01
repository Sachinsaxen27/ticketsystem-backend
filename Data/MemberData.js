const express = require('express')
const AdminSchema = require('../Schema/AdminSchema')
const MemberSchema = require('../Schema/MemberSchema')
const router = express.Router()
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const fetchmember = require('../Middleware/FetchMember')
//! ROUTER 1 FOR ADD MEMBER THROUGH ADMIN
router.post('/add_member', [
    body('name').isLength({ min: 3, max: 15 }),
    body("email").isEmail()], async (req, res) => {
        let success = false
        let message=''
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // console.log("errors", errors)
            return res.status(400).json({ success, errors: errors.array() });
        }
        try {
            const admin = req.headers.id
            const adminres = await AdminSchema.findById(admin)
            let member = await AdminSchema.findOne({ email: req.body.email })
            if (member) {
                return res.status(400).json({success,message:'Already Exist as Admin'} );
            }
            member = await MemberSchema.findOne({ email: req.body.email })
            if(member){
                return res.status(400).json({success,message:"Already exist"})
            }
            member = await MemberSchema.create({
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                password: adminres.password,
                role: "Member",
                admin: adminres._id
            })
            const data = {
                member: {
                    id: member.id
                }
            }
            const jwt_Sign = "Sachin_Saxena"
            const jwttoken = jwt.sign(data, jwt_Sign)
            success = true
            res.json({ success, jwttoken })
        } catch (error) {
            // console.log(error)
            res.status(500).send(error, "Some Error Occurred")
        }
    })

//? ROUTER 2 FOR MEMBER LOGIN 
// router.post("/member_Login", [
//     body('email').isEmail(),
//     body('password').exists()
// ], async (req, res) => {

//     const errors = validationResult(req);

//     if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//     }

//     const { password, email } = req.body
//     let success = false

//     try {
//         // finding the email
//         let member = await MemberSchema.findOne({ email })
//         if (!member) {
//             return res.status(500).json({ success, error: "Incorrect information" })
//         }

//         const passwordCompare = await bcrypt.compare(password, member.password)
//         if (!passwordCompare) {
//             return res.status(500).json({ error: "Incorrect information" })
//         }
//         const payload = {
//             member: {
//                 id: member.id
//             }
//         }
//         const jwt_Sign = "Sachin_Saxena"
//         const authtoken = jwt.sign(payload, jwt_Sign)
//         res.json({ success: true, authtoken })
//     } catch (error) {
//         res.status(500).json(error)
//     }
// })
// ROUTER 3 FOR GETTING MEMBER DATA
router.get('/get_member_data', fetchmember, async (req, res) => {
    try {
        const userId = req.user;
        const admin = await MemberSchema.findById(userId).select('-__v')
        res.json(admin)
    } catch (error) {
        res.status(500).send("Some Error Occurred")
    }
})

//ROUTER 4 FETCH THE ADMIN DATA 
router.get('/All_ADMIN_data', async (req, res) => {
    try {
        const _id = req.headers.id
        const member = await AdminSchema.findById(_id).select('-__v')
        res.json(member)
    } catch (error) {
        res.status(500).send("Some Error Occurred")
    }
})
module.exports = router