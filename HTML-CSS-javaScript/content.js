let iframe = null;
let toggleButton = null;

async function injectSidebar() {
  if (document.getElementById("ai-writer-sidebar")) return;
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
  closeButton = document.createElement('button');
  closeButton.innerText = 'X';
  closeButton.style.cssText = `
    position: fixed;
    width: 30px;
    height: 30px;
    top: 10px;
    right: 10px;
    background: red;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    z-index: 1000000;
    font-size: 16px;
    font-weight: bold;
  `;
  closeButton.addEventListener('click', () => {
    removeSidebar();
  } );
  
  document.body.appendChild(iframe);
  document.body.appendChild(closeButton);
  document.body.style.paddingRight = '450px'; 
  
}

function removeSidebar() { 
  if(iframe){
    iframe.remove();
    closeButton.remove();
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

  toggleButton.addEventListener('click', () => {
    injectSidebar();
  });

  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = chrome.runtime.getURL('sidebar.css');
  document.head.appendChild(cssLink);
}

createToggleButton();

