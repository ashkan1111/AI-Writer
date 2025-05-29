require('dotenv').config(); 
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const bodyParser= require('body-parser');
const sqlite3= require('sqlite3').verbose();
const cors = require('cors');


const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

const db = new sqlite3.Database('./chat_history.db');

const app = express();
app.use(cors()); 
app.use(express.json()); 

db.serialize(() => {
  db.run (`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inhtml TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )  
    `);
});


const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({
     model: "gemini-2.0-flash"});


const history = {};

db.all(`SELECT * FROM history`, [], (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  if(rows){
    
    rows.forEach((row) => {
      if (!history[row.id]) {
      history[row.id] = [];
      }
      
      const chatContent = row.inhtml || "";
      const segments = chatContent.match(/<div class="response (?:user|ai)-message">[\s\S]*?<\/div>/g);
      
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const cleanText = segment.replace(/<[^>]+>/g, '').trim(); 
        
        if (segment.includes("user-message")) {
          history[row.id].push({ role: "user", parts: [{ text: cleanText }] });
        } else if (segment.includes("ai-message")) {
          history[row.id].push({ role: "model", parts: [{ text: cleanText }] });
        }
      }

    });
  }
});



app.post('/', async (req, res) => {
  const {message, chatID} = req.body;
  
  if (!message || !chatID) {
    return res.status(400).json({ error: 'Message or chatID missing!' });
  }
  let id;
  let newChat;
  if(Number(chatID) === -1){
    const rowsNumber = await getNumberOfRows();
    id = rowsNumber + 1;
    newChat = true;
  }
  else{
    id = chatID;
    newChat = false;
  }

  if (!history[id]) {
    history[id] = [];
  }
  try {
    const chat = model.startChat({
      history: history[id], 
      generationConfig: {
        temperature: 0.5,
        topP: 0.9,
        topK: 40,
      }
    });

    const {response} = await chat.sendMessage(message);
    const aiReply = md.render(response.text());

    save(id, newChat);
    res.json({ reply: aiReply, id: id });

  }catch (err){
    console.error('Error generating response:', err);
    res.status(500).json({ error: 'AI model failed to respond.' });
  }

});


async function getNumberOfRows(){
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) AS count FROM history`, (err, row) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        resolve(row.count);
      }
    });
  });
}


async function save(id, newChat){
  const chat = history[id];
  const chatHTML = chat.map((message) => {
    const roleClass = message.role === 'user' ? 'user-message' : 'ai-message';
    if(roleClass === 'ai-message'){
      const aiReply = md.render(message.parts[0].text);
      const aiReplyHTML = `<div class=\"response ai-message\">${aiReply}</div>`;
      return aiReplyHTML;
    }
    else{
      const userMessage = message.parts[0].text;
      const userMessageHTML = `<div class=\"response user-message\">${userMessage}</div>`;
      return userMessageHTML;
    }}).join('');

  if(newChat){
    db.run(`INSERT INTO history (inhtml) VALUES (?)`, [chatHTML], function (err){
      if (err){
        console.error(err);
      }
      console.log(`Row with ID ${id} inserted successfully.`);
    });
  
  }else{
    db.run(`UPDATE history SET inhtml = ? WHERE id = ?`, [chatHTML, id], function (err){
      if (err){
        console.error(err);
      }else {
      console.log(`Row with ID ${id} updated successfully.`);
      }
    });
  }
}



app.get('/get-history', (req, res) => {
  db.all(`SELECT * FROM history ORDER BY created_at DESC LIMIT 100`, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ history: [] });
    }
    res.json({ history: rows });
  });
});





const port = 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
