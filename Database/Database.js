require('dotenv').config()


const mongoose = require('mongoose')

const mongoURI = process.env.MONGO_URI || 'mongodb+srv://sachinsaxenapec:6WtVUNw16x6GjZap@ticketsystem-test.wia0j2o.mongodb.net/?retryWrites=true&w=majority&appName=ticketSystem-test'
const connectTomongo = () => {
    mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }, console.log("Database is now online"))
}
module.exports = connectTomongo;