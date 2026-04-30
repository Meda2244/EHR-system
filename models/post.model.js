

const mongoose = require("mongoose")

const Schema = mongoose.Schema

const postSchema = new Schema({
    title: { 
        type: String,
        trim : true,
        required: true,
    },
    content: {
        type: String,
        trim : true,
        required: true,
    },
    image: {
        type: String,
        trim : true,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
        trim : true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        trim : true
    }
})

const Post = mongoose.model('Post', postSchema)
module.exports = Post