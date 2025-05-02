const express = require('express')
const MessageSchema = require('../Schema/MessageSchem')
const router = express.Router()
const Conversation = require('../Schema/ConversationSchema')
const mongoose = require('mongoose')
const AdminSchema =require('../Schema/AdminSchema')
router.get('/s',async(req,res)=>{
    const admin=await AdminSchema.find()
    console.log(admin)
})
router.post('/send_message', async (req, res) => {
    let success = false
    try {
        const { senderid, senderModel, text, sender, role, userId, adminId } = req.body;
        const localdate = new Date().toLocaleString('en-IN',{timeZone:"Asia/Kolkata"})
        const [datePart, timePart] = localdate.split(', ');
        const [day, month, year] = datePart.split('/');
        const formatted = `${month}/${day}/${year} ${timePart}`;
        const localDate = new Date(formatted);
        const storedate = String(localDate.getFullYear()) + "-" + "0" + String(localDate.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
        })).split('/').join('') + timePart.slice(-5, -3)
        const participants = [userId, adminId];
        let conversation = await Conversation.findOne({
            participants: { $all: participants, $size: 2 }
        });
        if (!conversation) {
            conversation = new Conversation({ participants: participants, status: "Unresolved", ticket: storedate });
            await conversation.save();
        }
        const message = new MessageSchema({
            senderid,
            senderModel,
            message: { sender, text, time: localdate },
            role,
            conversationID: conversation._id,
        });

        const savedMessage = await message.save();
        success = true
        res.status(200).json({
            success,
            message: "Message sent successfully",
            conversationId: conversation._id,
            data: savedMessage,
            localdate
        });
    } catch (error) {
        success = false
        console.log(error)
        res.status(500).json({ success, error: "Failed to send message" });
    }
})

router.get('/all_message', async (req, res) => {
    let success = true
    const Allchat = await MessageSchema.aggregate([
        {
            $match: {
                role: "user"
            }
        }
    ])
    res.status(200).json({ success, Allchat })
})

router.get('/get_messages/:userId', async (req, res) => {
    try {
        if (req.params.userId) {    
            const userId = req.params.userId;
            const conversation = await Conversation.find({ participants: userId })

            const conversationIds = conversation.map(conv => conv._id);
            // console.log(conversationIds)
            const messages = await MessageSchema.find({
                conversationID: { $in: conversationIds }
            }).populate('senderid');
            const ticket = conversation.map(conv => conv.ticket)
            res.status(200).json({ messages, ticket })
        }else{
            return
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, error: "Failed to fetch messages" });
    }
});

router.get('/All_conversation/:id', async (req, res) => {
    try {
        let status = (req.params.id).length > 2 ? req.params.id : ""
        let success = false
        let conversation
        let user
        console.log(status.length)
        if (status.length > 2) {
            conversation = await Conversation.find({ status: status })
            const conversationIds = conversation.map(conv => conv._id);
            user = await MessageSchema.find({ conversationID: conversationIds, role: 'user' })
        } else {
            conversation = await Conversation.find()
        }
        if (!conversation) {
            return res.status(404).json({ success, message: "No chats available" })
        }
        success = true
        return res.status(200).json({ success, user, conversation })
    } catch (error) {
        res.status(500).json(error)
    }
})

router.get('/countConversation/:id', async (req, res) => {
    let sccuess = false
    try {
        const conversationID = req.params.id
        const chat = await MessageSchema.find({ conversationID: conversationID })
        res.status(200).json(chat)
    } catch (error) {
        // console.log(error)
        res.status(500).json(error)
    }

})
//! ROUTER 6 FOR GETTING AVERAGE TIME
        router.get('/Conversation_Average', async (req, res) => {
            const conversationIds = await Conversation.find()
            const consarray = []
            let userMessageTime = []
            let adminMessageTime = []
            let conver = 0
            let resolvedpercentage = 0
            for (i in conversationIds) {
                conver += 1
                if (conversationIds[i].status === 'resolved') {
                    resolvedpercentage += 1
                }
                const message = await MessageSchema.find({ conversationID: conversationIds[i]._id })
                message.filter((item) => {
                    if (item.role == 'user' && userMessageTime.length == 0) {
                        const [datePart, timePart] = item.message.time.split(', ');
                        const [day, month, year] = datePart.split('/');
                        const formatted = `${month}/${day}/${year} ${timePart}`;
                        userMessageTime = formatted
                    } else if (item.role == 'member' || item.role == 'admin' && adminMessageTime.length == 0) {
                        const [adminPart, timerParts] = item.message.time.split(', ')
                        const [days, months, years] = adminPart.split('/');
                        const formatteds = `${months}/${days}/${years} ${timerParts}`;
                        adminMessageTime = formatteds

                    } else {
                        return;
                    }
                })
            }
            console.log(userMessageTime)
            console.log(adminMessageTime)
            const finalpercentage = (Math.floor((resolvedpercentage / conver) * 100))
            const localuser = new Date(userMessageTime)
            const localadmin = new Date(adminMessageTime)
            // console.log(Math.floor((localadmin - localuser) / (1000 * 60 * 60)))
            const gap = Math.floor(((localadmin - localuser) / 1000) / 2)
            res.status(200).json({ gap, conver, finalpercentage })
        })
//? ROUTER 7 FOR GET ALL THE MISSED CHAT
router.get('/Missed_chat', async (req, res) => {
    const conversationId = await Conversation.find();
    let missedChatsPerDay = {};

    for (let i = 0; i < conversationId.length; i++) {
        const conversation = conversationId[i];
        const adminReply = await MessageSchema.find({ conversationID: conversation._id, role: 'member' });
        const userReply = await MessageSchema.find({ conversationID: conversation._id, role: 'user' });

        let userDate;
        let day, month, year;
        if (userReply.length > 0) {
            const [datePart] = userReply[0].message.time.split(', ');
            [day, month, year] = datePart.split('/');
            day = day.padStart(2, '0')
            month = month.padStart(2, '0')
            userDate = `${year}-${month}-${day}`;
        }

        let missed = false;
        let finalAdminReply = adminReply;

        if (adminReply.length === 0) {
            finalAdminReply = await MessageSchema.find({ conversationID: conversation._id, role: 'admin' });
        }

        if (userReply.length > 0 && finalAdminReply.length > 0) {
            const userTime = new Date(`${month}/${day}/${year} ${userReply[0].message.time.split(', ')[1]}`);
            const adminTime = new Date(`${month}/${day}/${year} ${finalAdminReply[0].message.time.split(', ')[1]}`);
            if ((adminTime - userTime) / (1000 * 60 * 60) >= 3) {
                missed = true;
            }
        }

        if (missed && userDate) {
            missedChatsPerDay[userDate] = (missedChatsPerDay[userDate] || 0) + 1;
        }
    }

    res.status(200).json(Object.entries(missedChatsPerDay).map(([date, count]) => ({ date, count })));
});

router.get('/Search_Conversation/:id', async (req, res) => {
    let success = false
    try {
        const ticketnumber = req.params.id

        const conversationticket = await Conversation.find({ ticket: ticketnumber })
        if (!conversationticket) {
            return res.status(404).json({ success, message: "Not found" })
        }
        const message = await MessageSchema.find({ conversationID: conversationticket[0]._id })
        success = true
        res.status(200).json({ success, message })
    } catch (error) {
        res.status(400).json({ success, error })

    }
})
module.exports = router