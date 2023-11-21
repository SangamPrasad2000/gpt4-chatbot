const socket = io();
socket.on("message", (message) => {
    removeTypingIndicator();
    displayMessage("assistant", message); // Display assistant's message in the chat
});

socket.on("typing", () => {
    displayTypingIndicator();
});

//Add listener for enter key
document.getElementById("message-input").addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        submitClick();
    }
});

async function getMessages() {
    const response = await fetch("/api/messages");
    const messages = await response.json();

    if (messages.length > 0) {
        messages.forEach((message) => {
            displayMessage(message.role, message.content);
        });
    }
}

getMessages()

function displayMessage(role, message) {
    const div = document.createElement("div");
    div.innerHTML = `<p><b>${
        role === "user" ? "You" : "Assistant"
    }:</b> ${message}</p>`;
    // Add the "user" or "assistant" class to the div
    div.classList.add(role);
    const messages = document.getElementById("messages");
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function displayTypingIndicator() {
    const div = document.createElement("div");
    div.innerHTML = '<p><i>Assistant is typing...</i></p>';
    div.classList.add("assistant"); // You can adjust the class as needed
    const messages = document.getElementById("messages");
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function removeTypingIndicator() {
    const messages = document.getElementById("messages");
    const lastMessage = messages.lastChild;
    if (lastMessage.classList.contains("assistant")) {
        messages.removeChild(lastMessage);
    }
}


function submitClick() {
    //get text from input id-message-input
    const message = document.getElementById("message-input").value;
    displayMessage("user", message);

    socket.emit("sendMessage", message, (error) => {
        if (error) {
            return alert(error);
        }
    });
    //Clear input
    document.getElementById("message-input").value = "";
    message.focus();
}

