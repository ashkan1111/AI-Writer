let iframe = null;
let toggleButton = null;



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
    item.textContent = `[${counter}]: ` + chatText.slice(0, 20) + (chatText.length > 20 ? "..." : "");
    counter++;
    item.style.cssText = `
      padding: 10px;
      border-bottom: 1px solid #ccc;
      cursor: pointer;
      background: #f9f9f9;
      transition: background 0.3s;
    `;
    item.addEventListener("mouseover", () => {
      item.style.background = "#e0e0e0";
    });
    item.addEventListener("mouseout", () => {
      item.style.background = "#f9f9f9";
    });
    item.onclick = () => {
      showChatInSidebar(chat.inhtml, chat.id);
      const historySidebar = document.getElementById("chat-history-list");
      historySidebar.remove();
    };
      
    
      
    historyList.appendChild(item);
  });
}

function showChatInSidebar(chat, chatID) {
  iframe.contentWindow.postMessage({ type: "show-chat", chat, chatID }, "*");
}




async function injectSidebar() {
  if (document.getElementById("ai-writer-sidebar")) return;
  return new Promise(async (resolve) =>{
  iframe = document.createElement("iframe");
  iframe.src = await chrome.runtime.getURL("AIWriter.html");
  iframe.id = "ai-writer-sidebar";
  iframe.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 450px;
    height: 100vh;
    border: none;
    z-index: 999999;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
    `;
    iframe.onload = () => {
      resolve();
    };
 
    buttons = document.createElement('div');
    buttons.style.cssText = `
    position: fixed;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    background: white;
    
    top: 10px;
    right: 10px;
    z-index: 1000000;
    `;
    
    closeButton = document.createElement('button');
    closeButton.id = 'close-sidebar';
    closeButton.innerHTML = 'X';
    closeButton.style.cssText = `
    width: 30px;
    height: 30px;
    
    
    background: red;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    `;
    
    hamburgerMenu = document.createElement('button');
    hamburgerMenu.innerHTML = '&#9776;';
    hamburgerMenu.style.cssText = `
    width: 30px;
    heigh: 30px;
    color: black;
    margin-right: 10px;
    background: white;
    font-size: 30px;
    border: none;
    cursor: pointer;
    `;
    buttons.appendChild(closeButton);
    buttons.appendChild(hamburgerMenu);
    document.body.appendChild(buttons);
    
    closeButton.addEventListener('click', async () => {
      removeSidebar();
    });
    closeButton.addEventListener('mouseover', () => {
     closeButton.style.background = 'darkred';
     closeButton.style.color = 'white';
    });
   closeButton.addEventListener('mouseout', () => {
     closeButton.style.background = 'red';
     closeButton.style.color = 'white';
    });
  
  
  hamburgerMenu.addEventListener('click', () => {
    const historySidebar = document.createElement('div');
    historySidebar.id = 'chat-history-list';
    historySidebar.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 450px;
    height: 100vh;
    background: white;
    overflow-y: auto;
    z-index: 9999999;
    `;
    historySidebar.innerHTML = `
    <h2 style="display:inline-block">Chat History</h2> 
    <button id="close-history" style="float:right;
    background: white;
    border: none;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;">&#8594;</button>
    <div id="chat-history-container"></div>
    `;
    
    // historySidebar.innerHTML += `<div id="chat-history-list"></div>`;
    document.body.appendChild(historySidebar);
    updateChatHistoryMenu();
    
    historySidebar.querySelector('#close-history').addEventListener('click', () => {
      historySidebar.remove();
    });
    
    
  });
  
  document.body.appendChild(iframe);
  document.body.style.paddingRight = '450px'; 
});
  
}

function removeSidebar() { 
  if(iframe){
    iframe.remove();
    closeButton.remove();
    hamburgerMenu.remove();
    buttons.remove();
    buttons = null;
    hamburgerMenu = null;
    closeButton = null;
    iframe = null;
    document.body.style.paddingRight = '';
  }
}

function createToggleButton() {
  toggleButton = document.createElement('div');
  toggleButton.id = 'ai-writer-toggle-button';
  toggleButton.innerHTML = `<img src="${chrome.runtime.getURL('icon.png')}" alt="AI Writer" style="width: 30px; height: 30px; cursor: pointer;">`;
  document.body.appendChild(toggleButton);

  toggleButton.addEventListener('click', async () => {
    const selectedText = window.getSelection().toString().trim();
    await injectSidebar();
    iframe.contentWindow.postMessage({type: "selected", message: selectedText}, "*");
  });

  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = chrome.runtime.getURL('sidebar.css');
  document.head.appendChild(cssLink);
}

createToggleButton();


const icon = document.getElementById('ai-writer-toggle-button');

window.addEventListener("mouseup", async (event) =>{
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if(selectedText.length > 0){
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect(); 
    icon.style.top = `${rect.top + window.scrollY - 10}px`;
    icon.style.left = `${rect.right + window.scrollX + 10}px`;
    icon.id = 'ai-writer-toggle-button-selected';
    icon.style.display = "flex";
  }else{
    icon.id = 'ai-writer-toggle-button';
    icon.style.top = '50%';
    icon.style.right = '10px';
    icon.style.left='auto';
  }

});







