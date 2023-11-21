require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const {Configuration, OpenAIApi} = require("openai");
const {connectDB, ChatModel} = require("./mongoose");
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const port = process.env.PORT || 3000;

// OpenAI API configuration
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.use(express.static("public"));
connectDB();

//Create API endpoint to get all messages from mongoDB
app.get("/api/messages", async (req, res) => {
        try {
            const messages = await ChatModel.find({})
                .then((data) => {
                    return data.map((message) => {
                        return {
                            role: message.sender,
                            content: message.message,
                            timestamp: message.timestamp
                        }
                    })
                })
            res.json(messages);
        } catch (error) {
            console.error(error);
            res.status(500).json({message: "Server Error"});
        }
    }
);

io.on("connection", async (socket) => {
    console.log("New user connected");

    // Initialize the conversation history
    const conversationHistory = [];

    socket.on("sendMessage", async (message, callback) => {
        //Send typing indicator
        socket.emit("typing");
        try {
            if (!message || message.length === 0 || message.trim() === "") {
                socket.emit("message", "Please enter a message");
                callback();
                return
            }
            // Add the user message to the conversation history
            conversationHistory.push({role: "user", content: message});

            const completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: conversationHistory,
            });

            const response = completion.data.choices[0].message.content;
            console.log(response);
            //Store message and resopnse in mongoDB
            const chat = new ChatModel({
                message: message,
                sender: "user",
                timestamp: new Date().toLocaleString()
            });

            await chat.save();

            const chat2 = new ChatModel({
                message: response,
                sender: "assistant",
                timestamp: new Date().toLocaleString()
            });

            await chat2.save();


            // Add the assistant's response to the conversation history
            conversationHistory.push({role: "assistant", content: response,
                timestamp: new Date().toLocaleString()
            });

            socket.emit("message", response);
            callback();
        } catch (error) {
            console.error(error);
            callback("Error: Unable to connect to the chatbot");
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});