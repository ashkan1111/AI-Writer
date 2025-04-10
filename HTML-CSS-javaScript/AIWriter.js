async function submitMessage() {
  const inputField = document.getElementById("chatInput");
  const chatBox = document.getElementById("chatBox");
  const messageText = inputField.value.trim();

  if (messageText === "") return;

  
  const userMessage = document.createElement("div");
  userMessage.classList.add("message");
  userMessage.textContent = messageText;
  chatBox.appendChild(userMessage);
  inputField.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  
  try {
      const response = await fetch("http://localhost:3000", { 
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({ message: messageText })
      });

      const data = await response.json();
      const aiReply = data.reply; 


      const aiMessage = document.createElement("div");
      aiMessage.classList.add("message", "bot-message");
      aiMessage.innerHTML = aiReply;
      
      chatBox.appendChild(aiMessage);
      chatBox.scrollTop = chatBox.scrollHeight;

  } catch (err) {
      console.error("Error:", err);
  }
}