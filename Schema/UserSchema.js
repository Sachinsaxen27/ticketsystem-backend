const mongoose = require('mongoose')
const { Schema } = mongoose
const UserSchema = new Schema({
    AdminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminlogin',
        requred:true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    time:Date

})
module.exports = mongoose.model('userlogin', UserSchema)