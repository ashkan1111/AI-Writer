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

db.all(`SELECT * FROM history ORDER BY created_at DESC LIMIT 100`, [], (err, rows) => {
  if (err) {
    console.error(err);
    return res.status(500).json({ history: [] });
  }
  if(rows){
    
    rows.forEach((row) => {
      if (!history[row.id]) {
      history[row.id] = [];
    }
    
    
    const chatContent = row.inhtml || "";
    const segments = chatContent.split(/<\/div>\s*<div class="response /); 
    
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
  if (!history[chatID]) {
    history[chatID] = [];
  }
  try {
    const chat = model.startChat({
      history: history[chatID], 
      generationConfig: {
        temperature: 0.5,
        topP: 0.9,
        topK: 40,
      }
    });

    const {response} = await chat.sendMessage(message);

    history[chatID].push(
      { role: 'user', parts: [{ text: message }] },
      { role: 'model', parts: [{ text: response.text() }] }
    );

    const aiReply = md.render(response.text());
    res.json({ reply: aiReply });

  } catch (err) {
    console.error('Error generating response:', err);
    res.status(500).json({ error: 'AI model failed to respond.' });
  }

});



app.post('/save-history', (req, res) => {
  const chat = req.body.chat;
  const id = req.body.id;
  if(id === 0){
    db.run(`INSERT INTO history (inhtml) VALUES (?)`, [chat], function (err){
      if (err){
        console.error(err);
        return res.status(500).json({ success: false });
      }
      res.json({ success: true });
  
    });
  }
  else{
    db.run(`UPDATE history SET inhtml = ? WHERE id = ?`, [chat, req.body.id], function (err){
      if (err){
        console.error(err);
        return res.status(500).json({ success: false });
      }else {
      console.log(`Row with ID ${req.body.id} updated successfully.`);
      }
      res.json({ success: true });
    });
  }



});




app.get('/get-history', (req, res) => {
  db.all(`SELECT * FROM history ORDER BY created_at DESC LIMIT 100`, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ history: [] });
    }
    res.json({ history: rows });
  });
});

app.get('/history/count', (req, res) => {
  db.get(`SELECT COUNT(*) AS count FROM history`, [], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ count: 0 });
    }
    res.json({ count: row.count });
  });
});


const port = 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});


