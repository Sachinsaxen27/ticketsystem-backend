const jwt = require('jsonwebtoken')
const jwt_Sign = "Sachin_Saxena"
const fetchuser = async (req, res, next) => {
    const token = req.header('auth-token')
    if (!token) {
        return res.status(401).json({ error: "Incorrect information" })
    }
    try {
        const datas = jwt.verify(token, jwt_Sign);
        // console.log(datas)
        req.user = datas.member.id

        next();
    } catch (error) {
        console.log(error)
        return res.status(401).json({ error: "Incorrects" })
    }
}
module.exports = fetchuser