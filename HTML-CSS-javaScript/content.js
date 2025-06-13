let iframe = null;
let toggleButton = null;

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
 

    closeButton = document.createElement('button');
    closeButton.id = 'close-sidebar';
    closeButton.innerHTML = 'X';
    closeButton.style.cssText = `
    width: 30px;
    height: 30px;
    position: fixed;
    top: 10px;
    right: 10px;
    background: red;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    z-index: 99999999;
    `;
  
    document.body.appendChild(closeButton);
    
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
  
  document.body.appendChild(iframe);
  document.body.style.paddingRight = '450px'; 
});
  
}

function removeSidebar() { 
  if(iframe){
    iframe.remove();
    closeButton.remove();
    buttons = null;
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







