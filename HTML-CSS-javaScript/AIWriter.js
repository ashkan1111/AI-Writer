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

  sendButton.addEventListener('click', submitMessage);

  actionButtons.forEach((button) => {
    button.addEventListener('click', () => quickPrompt(button.textContent.trim()));
  });
});

async function submitMessage() {
  const inputField = document.getElementById("chatInput");
  const chatBox = document.getElementById("chatBox");
  const userPrompt = inputField.value.trim();

  if (!userPrompt) return; 

  inputField.value = ""; 

  const userBubble = document.createElement("div");
  userBubble.className = "response user-message";
  userBubble.textContent = userPrompt; 
  chatBox.appendChild(userBubble);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch("http://localhost:3000", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: userPrompt })
    });

    const data = await response.json();
    const aiReply = data.reply; 
    const aiText = aiReply.replace(/<[^>]+>/g, '');

    const aiBubble = document.createElement("div");
    aiBubble.className = "response ai-message";
    aiBubble.innerHTML = aiReply;
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


    aiBubble.appendChild(copyButton);
    chatBox.appendChild(aiBubble);
    chatBox.scrollTop = chatBox.scrollHeight;

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
