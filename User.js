const mongo = require('mongoose')

const userSchema = new mongo.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }, 
    date: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongo.model('User', userSchema)