require('dotenv').config(); 
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');

const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

const app = express();
app.use(cors()); 
app.use(express.json()); 


const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: "gemini-1.5-flash" });

app.post('/', async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: 'No message provided!' });
    }

    try {
        const {response} = await model.generateContent(userMessage);
        const aiReply = md.render(response.text()); 
        res.json({ reply: aiReply });
    } catch (error) {
        console.error('Error in generating response:', error);
        res.status(500).json({ error: 'Failed to get a response from the AI model.' });
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});