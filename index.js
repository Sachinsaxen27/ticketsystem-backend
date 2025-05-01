require('dotenv').config()

const express = require('express')
const database = require('./Database/Database')
const cors = require('cors')
database()

const app = express()
const port = process.env.PORT || 5000;

app.use(cors({origin:'https://superb-strudel-e95cca.netlify.app',credentials:true}));

// app.options("*", cors(corsvalue))
app.use(express.json({ limit: "10mb", extended: true }))
app.use(express.urlencoded({ limit: "10mb", extended: true, parameterLimit: 50000 }))

app.use('/api/adminlogin', require('./Data/AdminData'))
app.use('/api/memberlogin', require('./Data/MemberData'))
app.use('/api/userlogin', require('./Data/UserData'))
app.use('/api/messagebox', require('./Data/MessageData'))
app.listen(port, () => {
    console.log(`Ticket System is Online at http://localhost:${port}`)
})