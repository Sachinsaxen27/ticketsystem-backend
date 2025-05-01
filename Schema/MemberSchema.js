const mongoose = require('mongoose')
const { Schema } = mongoose

const MemberSchema = new Schema({
    admin: {
        type:String,
        required:true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    password: {
        type:String
    },
    phone:{
        type:Number,
        // required:true
    }
})
module.exports=mongoose.model('memberlogin',MemberSchema)
