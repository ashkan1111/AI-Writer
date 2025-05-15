
/////////////////////////////////////////////////////////Rendering/////////////////////////////////////////////////////////
function renderChatBubble(className, text) {
  const chatBox = document.getElementById("chatBox");
  const bubble = document.createElement("div");
  bubble.className = "response " + className;
  bubble.innerHTML = text;
  const aiText = text.replace(/<[^>]+>/g, '');
  if(className === "ai-message"){
    const copyButton = document.createElement("button");
    copyButton.textContent = "Copy";
    copyButton.className = "copy-button";
    copyButton.addEventListener("click", () => {
        const textarea = document.createElement("textarea");
        textarea.value = aiText;
        textarea.style.position = "fixed"; 
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        copyButton.textContent = "Copied!";
        setTimeout(() => {
          copyButton.textContent = "Copy";
        }, 2000);

        try {
          document.execCommand("copy");
        } catch (err) {
          console.error("Copy failed!", err);
        }
        document.body.removeChild(textarea);

    });
    bubble.appendChild(copyButton);
  }

  chatBox.appendChild(bubble);
  chatBox.scrollTop = chatBox.scrollHeight;

}

/////////////////////////////////////////////////////////Rendering/////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////Initialize/////////////////////////////////////////////////////////

window.addEventListener('DOMContentLoaded', () => {
  const inputField = document.getElementById("chatInput");
  const sendButton = document.querySelector('.send-button');
  const actionButtons = document.querySelectorAll('.action-buttons button');

  inputField.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); 
      submitMessage();
      const activeButton = Array.from(actionButtons).find((button) => button.classList.contains('active'));
      if (activeButton) {
        activeButton.classList.remove('active');
      }
    }
    if(event.key === 'backspace' && inputField.value === "") {
      actionButtons.forEach((button) => {
        button.classList.remove('active');
      });
    }
  });

  sendButton.addEventListener('click', () =>{
    submitMessage();
    const activeButton = Array.from(actionButtons).find((button) => button.classList.contains('active'));
    if (activeButton) {
      activeButton.classList.remove('active');
    }

  });

  actionButtons.forEach((button) => {
    button.addEventListener('click', () => quickPrompt(button.textContent.trim()));
  });

  window.addEventListener("message", async (event) => {
    if(event.data.type === "save-and-close"){
        await saveChat();        
        window.parent.postMessage({type: "close"}, "*");
    }
    if(event.data.type === "selected"){
      const inputField = document.getElementById('chatInput');
      inputField.value = event.data.message;
    }
    if(event.data.type === "show-chat"){
      const chatBox = document.getElementById("chatBox");
      if(chatBox.innerHTML !== ""){
        saveChat();        
      }
      chatBox.innerHTML = event.data.chat;
      const aiResponse = chatBox.querySelector(".ai-message");
      const aiText = aiResponse ? aiResponse.innerHTML.replace(/<[^>]+>/g, '') : "";
      const copyButtons = document.querySelectorAll(".copy-button");
      copyButtons.forEach((copyButton) => {
        copyButton.addEventListener("click", () => {
          const textarea = document.createElement("textarea");
          textarea.value = aiText;
          textarea.style.position = "fixed"; 
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
  
          copyButton.textContent = "Copied!";
          setTimeout(() => {
            copyButton.textContent = "Copy";
          }, 2000);
  
          try {
            document.execCommand("copy");
          } catch (err) {
            console.error("Copy failed!", err);
          }
          document.body.removeChild(textarea);
  
        });
      });
  
      const sign = document.createElement("input");
      sign.type = "hidden";
      sign.className = "sign";
      sign.value= event.data.chatID;
      chatBox.appendChild(sign);
    }

  });
  
});





async function saveChat() {
  const chatBox = document.getElementById("chatBox");
  if (chatBox.querySelector(".sign")){
    const id = Number(chatBox.querySelector(".sign").value);
    chatBox.removeChild(chatBox.querySelector(".sign"));
    const chat = chatBox.innerHTML;
    if(chat !== ""){
      try {
        const res = await fetch("http://localhost:3000/save-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({chat:chat, id: id})
        });
        const { success } = await res.json();
        console.log("Chat saved successfully:", success);
      } catch (err) {
        console.error("Failed to save to database:", err);
      }
    }
  }
  else{
    const chat = chatBox.innerHTML;
    const id = 0;
    if(chat !== ""){
      try {
        const res = await fetch("http://localhost:3000/save-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({chat:chat, id: id})
        });
        const { success } = await res.json();
        console.log("Chat saved successfully:", success);
      } catch (err) {
        console.error("Failed to save to database:", err);
      }
    }
  }

}









///////////////////////////////////////////////////////////Initialize/////////////////////////////////////////////////////////



/////////////////////////////////////////////////////////Submitting/////////////////////////////////////////////////////////

async function submitMessage() {
  const inputField = document.getElementById("chatInput");
  const chatBox = document.getElementById("chatBox");
  const userPrompt = inputField.value.trim();

  if (!userPrompt) return; 

  inputField.value = ""; 
  renderChatBubble("user-message", userPrompt);


  if(!chatBox.querySelector(".sign")){
    const rowsCount = await fetch("http://localhost:3000/history/count");
    const rowsNum = await rowsCount.json();
    const chatID = rowsNum.count + 1;
    try {
    const response = await fetch("http://localhost:3000", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: userPrompt, chatID: chatID })
    });

    const data = await response.json();
    const aiReply = data.reply; 
    renderChatBubble("ai-message", aiReply);

    }catch (err){
      console.error("Error fetching AI reply:", err);
      const errorBubble = document.createElement("div");
      errorBubble.className = "response ai-message"; 
      errorBubble.style.color = "red";
      errorBubble.textContent = "Sorry, I couldn't get a response. Please try again.";
      chatBox.appendChild(errorBubble);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }else{
    const chatID = Number(chatBox.querySelector(".sign").value);
    try {
      const response = await fetch("http://localhost:3000", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userPrompt, chatID: chatID })
      });

      const data = await response.json();
      const aiReply = data.reply; 
      renderChatBubble("ai-message", aiReply);


  } catch (err) {
    console.error("Error fetching AI reply:", err);
    const errorBubble = document.createElement("div");
    errorBubble.className = "response ai-message"; 
    errorBubble.style.color = "red";
    errorBubble.textContent = "Sorry, I couldn't get a response. Please try again.";
    chatBox.appendChild(errorBubble);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  }
}

/////////////////////////////////////////////////////////Submitting/////////////////////////////////////////////////////////





/////////////////////////////////////////////////////////Quick prompt/////////////////////////////////////////////////////////

function quickPrompt(type) {
  const inputField = document.getElementById("chatInput");
  const actionButtons = document.querySelectorAll('.action-buttons button');
  const button = Array.from(actionButtons).find((btn) => btn.textContent.trim() === type);

  if (button.classList.contains('active')) {
    button.classList.remove('active');
    const currentText = formatText(inputField.value.trim());
    inputField.value = currentText; 
    inputField.focus(); 
    return;
  }

  actionButtons.forEach((button) => {
    button.classList.remove('active');
  });
  

  button.classList.add('active');
  const currentText = formatText(inputField.value.trim());
  inputField.value = `${type}: ${currentText}`;
  inputField.focus();   
}

/////////////////////////////////////////////////////////Quick prompt/////////////////////////////////////////////////////////



function formatText(text) {
  if (!text) return ""; 
  const firstWord = text.split(" ")[0].toLowerCase(); 
  const actionTypes = ["summarize:", "formalize:", "rewrite:"]; 
  if(actionTypes.includes(firstWord)) {
    text = text.split(" ").slice(1).join(" "); 
  }
  if(firstWord === "translate") {
    text = text.split(" ").slice(3).join(" ");
  }
  return text.trim(); 

}

