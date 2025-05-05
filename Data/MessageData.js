const express = require('express')
const MessageSchema = require('../Schema/MessageSchem')
const router = express.Router()
const Conversation = require('../Schema/ConversationSchema')
const mongoose = require('mongoose')
const AdminSchema = require('../Schema/AdminSchema')

router.post('/send_message', async (req, res) => {
    let success = false
    try {
        const { senderid, senderModel, text, sender, role, userId, adminId } = req.body;
        const localdate = new Date().toLocaleString('en-IN', { timeZone: "Asia/Kolkata" })
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
        console.log(req.params.userId)
        if (req.params.userId) {
            const userId = req.params.userId;
            console.log(userId)
            const conversation = await Conversation.find({ participants: userId })

            const conversationIds = conversation.map(conv => conv._id);
            const messages = await MessageSchema.find({
                conversationID: { $in: conversationIds }
            }).populate('senderid');
            const ticket = conversation.map(conv => conv.ticket)
            res.status(200).json({ messages, ticket })
        } else {
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
    try {
        const conversationIds = await Conversation.find();
        let totalConversations = conversationIds.length;
        let resolvedCount = 0;
        let totalGap = 0;
        let validConversations = 0;

        for (const convo of conversationIds) {
            if (convo.status === 'resolved') {
                resolvedCount += 1;
            }

            const messages = await MessageSchema.find({ conversationID: convo._id });
            let userTime = null;
            let adminTime = null;

            for (const msg of messages) {
                if (msg.role === 'user' && !userTime) {
                    const [datePart, timePart] = msg.message.time.split(', ')
                    const [day, month, year] = datePart.split('/')
                    userTime = new Date(`${month}/${day}/${year} ${timePart}`)
                }

                if ((msg.role === 'admin' || msg.role === 'member') && !adminTime) {
                    const [datePart, timePart] = msg.message.time.split(', ')
                    const [day, month, year] = datePart.split('/')
                    adminTime = new Date(`${month}/${day}/${year} ${timePart}`)
                }

                if (userTime && adminTime) {

                    break;
                }
            }

            if (userTime && adminTime) {
                const gap = Math.abs(adminTime - userTime) / 1000
                totalGap += gap;
                validConversations += 1;
            }
        }

        const avgGap = validConversations > 0 ? Math.floor(totalGap / validConversations) : 0;
        const finalgap=Math.floor(avgGap/(1000*60))
        const resolvedPercentage = totalConversations > 0 ? Math.floor((resolvedCount / totalConversations) * 100) : 0;

        res.status(200).json({
            finalgap,
            totalConversations,
            resolvedPercentage
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//? ROUTER 7 FOR GET ALL THE MISSED CHAT
router.get('/Missed_chat', async (req, res) => {
    const conversations = await Conversation.find();
    let missedchat = {};

    for (const convo of conversations) {
        const userFirstmessage = await MessageSchema.find({conversationID: convo._id,role: 'user'}).sort({ timestamp: -1 });
        const adminfirst = await MessageSchema.find({conversationID: convo._id,role: { $in: ['admin', 'member'] }}).sort({ timestamp: 1 });
        if (userFirstmessage.length === 0 || adminfirst.length === 0) continue;

        const lastuser = userFirstmessage[0];
        const firstadmin = adminfirst.find(msg => msg.timestamp > lastuser.timestamp);

        if (!firstadmin) continue;

        const diffHours = (firstadmin.timestamp - lastuser.timestamp) / (1000 * 60 * 60);

        if (diffHours >= 3) {
            const userDate = lastuser.timestamp.toISOString().split('T')[0];
            missedchat[userDate] = (missedchat[userDate] || 0) + 1;
        }
    }

    res.status(200).json(Object.entries(missedchat).map(([date, count]) => ({ date, count })));
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