const mongoose=require('mongoose')
const {Schema}=mongoose
const AdminSchema= new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    phone:{
        type:Number,
        // required:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        required:true
    }
})
module.exports=mongoose.model('adminlogin',AdminSchema)