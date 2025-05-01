const mongoose = require('mongoose')

const { Schema } = mongoose
const ConversationSchema = new Schema({
    timestamp: {
        type: Date,
        default: Date.now
    },
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userlogin",
            required: true
        }
    ],
    status: String,
    ticket: String

})

module.exports = mongoose.model('conversationSchema', ConversationSchema)