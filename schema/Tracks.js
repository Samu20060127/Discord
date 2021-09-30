const mongo = require('mongoose')

const songTrack = new mongo.Schema({
    email: {
        type: String,
        required: true
    },
    name: {
        type: String, 
        required: true
    },
    track: {
        type: Array,
        required: true
    }, 
    date: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongo.model('Tracks', songTrack)