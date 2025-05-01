const mongoose = require('mongoose')

const { Schema } = mongoose
const MessageSchem = new Schema({
    senderid: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'senderModel'
    },
    senderModel: {
        type: String,
        required: true,
        enum: ['userlogin', 'adminlogin','memberlogin']
    },
    message: {
        sender: String,
        text: String,
        time: {
            type: String
        }
    },
    role: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    conversationID:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'conversationSchema'
    },
})

module.exports = mongoose.model('messagebox', MessageSchem)