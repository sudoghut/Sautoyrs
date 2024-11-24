```js
   function appendMessage(message: ChatCompletionMessageParam) {
     const chatBox = document.getElementById("chat-box");
     const container = document.createElement("div");
     container.classList.add("message-container");

      Use the actual role from the message
     let currentMessageType: 'user' | 'assistant' | null = 
       message.role === 'user' || message.role === 'assistant'  
       ? message.role 
       : null;

      Assign classes based on the actual role
     if (currentMessageType === 'user') {
         container.classList.add("user");
     } else if (currentMessageType === 'assistant') {
         container.classList.add("assistant");
     }

      Styling based on isRoleOne.current
     if (isRoleOne.current === 0) { 
         container.classList.add(
             "bg-gradient-to-r",
             "from-green-500/10",
             "to-green-600/10",
             "border-l-4",
             "border-green-500",
             "p-4");
     } else if (isRoleOne.current === 1) {
         container.classList.add(
             "bg-gradient-to-r",
             "from-blue-500/10",
             "to-blue-600/10",
             "border-l-4",
             "border-blue-500",
             "p-4");
     } else if (isRoleOne.current === 2) {
         container.classList.add(
             "bg-gradient-to-r",
             "from-gray-500/10",
             "to-gray-600/10",
             "border-l-4",
             "border-gray-500",
             "p-4");
     }

     const newMessage = document.createElement("div");
     newMessage.classList.add("message");
     newMessage.textContent = typeof message.content === 'string' ? message.content : '';

      Text color based on isRoleOne.current
     if (isRoleOne.current === 0) { 
         newMessage.classList.add("text-green-400");
     } else if (isRoleOne.current === 1) { 
         newMessage.classList.add("text-blue-400");
     } else if (isRoleOne.current === 2) { 
         newMessage.classList.add("text-gray-400");
     }

     container.appendChild(newMessage);
     if (chatBox) {
         chatBox.appendChild(container);
         scrollToBottom();
     }

      Update the last message type if needed
     lastMessageType = currentMessageType;
 }
```