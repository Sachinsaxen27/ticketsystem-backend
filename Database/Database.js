require('dotenv').config()


const mongoose = require('mongoose')

const mongoURI = process.env.MONGO_URI
// || 'mongodb+srv://sachinsaxenapec:6WtVUNw16x6GjZap@ticketsystem-test.wia0j2o.mongodb.net/?retryWrites=true&w=majority&appName=ticketSystem-test'
const connectTomongo = () => {
    mongoose.connect(mongoURI).then(() => console.log('MongoDB connected!'))
        .catch((err) => console.error('MongoDB connection error:', err));
}
module.exports = connectTomongo;