




document.addEventListener('DOMContentLoaded', () => {
  
  const closeButton = document.getElementById('hamburger-menu');
  const sidebar = document.getElementById('history-sidebar');
////////////////////////////////////////////////////////////////////////

  if (closeButton && sidebar) {
    closeButton.addEventListener('click', () => {
      if(sidebar.classList.contains('show')){
        sidebar.classList.remove('show');
        sidebar.innerHTML = '';
      }else{
        sidebar.classList.add('show');
        sidebar.innerHTML = `

        <div class="new-chat">

          <div>New chat</div>
        
        </div>

        <div class="history-header-title">Recent</div>
        <div id="chat-history-container"></div>
        `;
        document.querySelector(".new-chat").addEventListener('click', newChat)
        updateChatHistoryMenu();
      }
    });
  }
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

  const inputField = document.getElementById("chatInput");
  const sendButton = document.querySelector('.send-button');
  const actionButtons = document.querySelectorAll('.action-buttons button');
  const chatBox = document.getElementById("chatBox");
  let direction = true;
  inputField.addEventListener('keydown', (event) =>{

    if(event.key !== ' ' && direction){
      if(containsPersian(event.key)){
        inputField.style.direction = "rtl";
        inputField.style.textAlign = "right";
        direction = false;
      }
      else{
        inputField.style.direction = "ltr";
        inputField.style.textAlign = "left";
        direction = false; 
      }
    }
    if(inputField.value ===''){
      direction = true;
    }

  });
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
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
////////////////////////////////////////////////////////////////////////


  
});

function newChat(){
  const chatBox = document.getElementById("chatBox");
  const sidebar = document.getElementById('history-sidebar');
  chatBox.innerHTML ='';
  sidebar.classList.remove('show');
  sidebar.innerHTML = '';
}


async function fetchChatHistory(){
  try{
    const response = await fetch("http://localhost:3000/get-history");
    const data = await response.json();
    console.log("Chat history: ", data);
    return data.history || [];
  }catch(err){
    console.error("Failed to load chat history: ", err);
    return [];
  }

}



async function updateChatHistoryMenu() {
  const historyList = document.getElementById("chat-history-container");
  if (!historyList) return;

  historyList.innerHTML = ""; 

  const chatHistory = await fetchChatHistory();
  let counter = 1;
  chatHistory.forEach((chat) => {
    const item = document.createElement("div");
    item.className = "chat-history-item";
    const chatText = chat.inhtml.replace(/<[^>]+>/g, '');
    item.textContent = chatText.slice(0, 20) + (chatText.length > 20 ? "..." : "");
    item.style.paddingLeft="20px";
    counter++;
    item.onclick = () => {
      showChatInSidebar(chat.inhtml, chat.id);
      const sidebar = document.getElementById('history-sidebar');
      sidebar.classList.remove('show');
      sidebar.innerHTML = '';
    };
      
    
      
    historyList.appendChild(item);
  });
}




function showChatInSidebar(chat, chatID) {
  chatBox.innerHTML = chat;
  const aiResponse = chatBox.querySelectorAll(".ai-message");
  const userMessage = chatBox.querySelectorAll(".user-message");
  aiResponse.forEach((aiResponse) => {
    if(containsPersian(aiResponse.innerHTML.replace(/<[^>]+>/g, ''))){
      aiResponse.style.direction = "rtl";
      aiResponse.style.textAlign = "right";
    }
    else {
      aiResponse.style.direction = "ltr";
      aiResponse.style.textAlign = "left";
    }
  });
  userMessage.forEach((userMessage) => {
    if(containsPersian(userMessage.innerHTML.replace(/<[^>]+>/g, ''))){
      userMessage.style.direction = "rtl";
      userMessage.style.textAlign = "right";
    }
    else {
      userMessage.style.direction = "ltr";
      userMessage.style.textAlign = "left";
    }
  });


  aiResponse.forEach((aiResponse) => {
    if(aiResponse.className !== "response ai-message") return;
    const copyButton = document.createElement("button");
    copyButton.textContent = "Copy";
    copyButton.className = "copy-button";
    aiResponse.appendChild(copyButton);
    const button = aiResponse.querySelector(".copy-button");
    button.addEventListener("click", () => {
      const textarea = document.createElement("textarea");
      const aiText = aiResponse.innerHTML.replace(/<button[^>]*>.*?<\/button>/, '').replace(/<[^>]+>/g, '');
      textarea.value = aiText;
      textarea.style.position = "fixed"; 
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      button.textContent = "Copied!";
      setTimeout(() => {
        button.textContent = "Copy";
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
  sign.value= chatID;
  chatBox.appendChild(sign);
   
}


function containsPersian(text) {
  const persianRegex = /[\u0600-\u06FF\u0750-\u077F]/;
  return persianRegex.test(text);
}



function renderChatBubble(className, text) {
  const chatBox = document.getElementById("chatBox");
  const bubble = document.createElement("div");
  bubble.className = "response " + className;
  bubble.innerHTML = text;
  const aiText = typeof text === 'string' ? text.replace(/<[^>]+>/g, '') : '';

  if(className === "ai-message"){
    if (containsPersian(aiText)) {
      bubble.style.direction = "rtl";
      bubble.style.textAlign = "right";
    }else {
      bubble.style.direction = "ltr";
      bubble.style.textAlign = "left";
    }
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






/////////////////////////////////////////////////////////Submitting/////////////////////////////////////////////////////////

async function submitMessage() {
  const inputField = document.getElementById("chatInput");
  const chatBox = document.getElementById("chatBox");
  const userPrompt = inputField.value.trim();

  if (!userPrompt) return; 

  inputField.value = ""; 
  renderChatBubble("user-message", userPrompt);


  if(!chatBox.querySelector(".sign")){
    const chatID = -1;
    try {
    const response = await fetch("http://localhost:3000", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: userPrompt, chatID: chatID })
    });

    const data = await response.json();
    const aiReply = typeof data.reply === 'string' ? data.reply : 'No response'; 
    renderChatBubble("ai-message", aiReply);
    const sign = document.createElement("input");
    sign.type = "hidden";
    sign.className = "sign";
    sign.value = data.id;
    chatBox.appendChild(sign);
    chatBox.scrollTop = chatBox.scrollHeight;

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

