const mongoose = require('mongoose')
const mongoURI = 'mongodb+srv://sachinsaxenapec:6WtVUNw16x6GjZap@ticketsystem-test.wia0j2o.mongodb.net/?retryWrites=true&w=majority&appName=ticketSystem-test'
const connectTomongo = () => {
    mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ssl: true,
    }, console.log("Database is now online"))
}
module.exports = connectTomongo;