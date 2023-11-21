const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

//Create Chats Schema
const chatSchema = new mongoose.Schema({
    message: String,
    sender: String,
    timestamp: String
});

//Create Chats Model
const ChatModel = mongoose.model('Chat', chatSchema);


module.exports = {connectDB, ChatModel};