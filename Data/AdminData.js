const express = require('express')
const AdminSchema = require('../Schema/AdminSchema')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const fetchadmin = require('../Middleware/FetchAdmin')
const MemberSchema = require('../Schema/MemberSchema')
const UserSchema = require('../Schema/UserSchema')
const Conversation = require('../Schema/ConversationSchema')
const MessageSchema = require('../Schema/MessageSchem')
//! ROUTER 1 FOR ADMIN REGISTRATION
router.post('/admin_Registration', [
    body('name').isLength({ min: 3, max: 15 }),
    body("email").isEmail(),
    body('password').isLength({ min: 6 }),
    body('phone').isLength({ min: 10, max: 12 })], async (req, res) => {
        let success = false
        let message = ''
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success, errors: errors.array() });
        }
        try {
            let admin = await MemberSchema.findOne({ email: req.body.email })
            if (admin) {
                return res.status(400).json({ success, message: "Already exist as member" });
            }
            admin = await AdminSchema.findOne({ email: req.body.email })
            if (admin) {
                return res.status(400).json({ success, message: "Already exist as Admin" });
            }
            const salt = await bcrypt.genSalt(10)
            const secpass = await bcrypt.hash(req.body.password, salt)
            admin = await AdminSchema.create({
                name: req.body.name,
                phone: req.body.phone,
                email: req.body.email,
                password: secpass,
                role: "Admin"
            })
            const data = {
                admin: {
                    id: admin.id
                }
            }
            const jwt_Sign = "Sachin_Saxena"
            const jwttoken = jwt.sign(data, jwt_Sign)
            success = true
            res.json({ success, jwttoken })
        } catch (error) {
            res.status(500).send(error, "Some Error Occurred")
        }
    })

//?ROUTER 2 FOR USER LOGIN
router.post("/admin_login", [body('email').isEmail(), body('password').exists()], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { password, email } = req.body
    let success = false

    try {
        // finding the email
        let admin = await AdminSchema.findOne({ email })
        let role = 'admin'
        if (!admin) {
            admin = await MemberSchema.findOne({ email })
            role = 'member'
        }
        if (!admin) {
            return res.status(500).json({ success, error: "Incorrect information" })
        }
        const passwordCompare = await bcrypt.compare(password, admin.password)
        if (!passwordCompare) {
            return res.status(500).json({ error: "Incorrect information" })
        }
        const payload = {
            admin: {
                id: admin.id
            }
        }
        const jwt_Sign = "Sachin_Saxena"
        const authtoken = jwt.sign(payload, jwt_Sign)
        res.json({ success: true, authtoken, role })
    } catch (error) {
        res.status(500).json(error)
    }
})

// ROUTER 3 FOR GETTING ADMIN ssssDATA
router.get('/x', fetchadmin, async (req, res) => {
    try {
        const userId = req.user;
        const admin = await AdminSchema.findById(userId).select('-__v')
        res.json(admin)
    } catch (error) {
        res.status(500).send("Some Error Occurred")
    }
})
router.get('/All_member_list', async (req, res) => {
    try {
        const id = req.headers.id
        const memberlist = await MemberSchema.find({ admin: id }, { name: 1, phone: 1, email: 1, role: 1 })
        res.json(memberlist)
    } catch (error) {
        res.status(500).send("Some Error Occurred")
    }
})

// ! ROUTER 4 FOR UPDATING BOTH ADMIN OR MEMBER PROFILE
router.put('/edit_Profile/:id', async (req, res) => {
    const { name, email, phone, role } = req.body
    const newdata = {}
    if (name) {
        newdata.name = name
    }
    if (email) {
        newdata.email = email
    }
    if (phone) {
        newdata.phone = phone
    }
    if (role) {
        newdata.role = role
    }
    let success = true
    let data = await AdminSchema.findById(req.params.id)
    if (!data) {
        data = await MemberSchema.findById(req.params.id)
        data = await MemberSchema.findByIdAndUpdate(req.params.id, { $set: newdata }, { new: true })
        success = true
        return res.status(200).json({ data, success })
    }
    if (!data) {
        success = false
        return res.status(404).json({ success, message: "No Record Fousssnd" })
    }
    data = await AdminSchema.findByIdAndUpdate(req.params.id, { $set: newdata }, { new: true })
    success = true
    return res.status(200).json({ data, success })
})

// ROUTER 5 FOR ALL CHAT AVAILABLE IN ADMIN
router.get('/allchats_Available_inAdmin', async (req, res) => {
    const id = req.headers.id
    let success = false
    if (id) {
        try {
            const user = await UserSchema.find({ AdminId: id })
            if (user.length === 0) {
                success = false
                return res.status(200).json({ success, message: 'No chats available' });
            }
            success = true
            return res.status(200).json({ success, user });
        } catch (error) {
            success = false
            return res.status(500).json({ success, error: 'Something went wrong', details: error.message });
        }
    } else {
        success = false
        return res.status(400).json({ success, error: 'Admin ID not provided in headers' });
    }
})

//! ROUTER 6 FOR ASSIGN CHAT TO MEMBER
router.put('/assignchat/:id', async (req, res) => {
    let success = false
    const id = req.params.id
    const { adminId, userId } = req.body
    const participants = [adminId, userId]
    let User = await UserSchema.findById(userId)
    let conversation = await Conversation.findById(id)
    let message = await MessageSchema.find({ conversationID: id })
    // let messageid=await MessageSchema.
    if (!conversation && !User) {
        return res.status(404).json({ success, message: "No Conversation" })
    }
    message = await MessageSchema.updateMany({ conversationID: id, role: 'admin' }, {
        $set: {
            senderid: adminId,
            senderModel: 'memberlogin',
            role: 'member'
        }
    })
    User = await UserSchema.findByIdAndUpdate(userId, { AdminId: adminId }, { new: true })
    conversation = await Conversation.findByIdAndUpdate(id, { participants: participants }, { new: true })

    success = true
    return res.status(200).json({ success, message: "Assign to other member is done" })
    // const participants=[userId,adminId]

})
//! ROUTER 6 FOR ASSIGN CHAT TO MEMBER
router.put('/conversationstatus/:id', async (req, res) => {
    let success = false
    const id = req.params.id
    const {status} = req.body
    let conversation = await Conversation.findById(id)
    // let messageid=await MessageSchema.
    if (!conversation) {
        return res.status(404).json({ success, message: "No Conversation" })
    }
    conversation = await Conversation.findByIdAndUpdate(id, { status: status }, { new: true })

    success = true
    return res.status(200).json({ success, message: "Status Updated" })
    // const participants=[userId,adminId]

})
router.delete('/deletemember/:id', async (req, res) => {
    let success = false
    try {
        let deletemember = await MemberSchema.findByIdAndDelete(req.params.id)
        success = true
        res.status(200).send(success)
    } catch (error) {
        // console.log(error)
        res.status(400).send(error)
    }
})

module.exports = router