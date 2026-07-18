const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const https = require("https");

const credentialSchema = new mongoose.Schema({
  role: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const Credential = mongoose.models.Credential || mongoose.model("Credential", credentialSchema);

// 🔑 GROQ API KEY
const groqKey = "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"; 

router.get("/admin-settings", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Portal Control Center</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
        body { background-color: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
        .settings-card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 400px; padding: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        h2 { text-align: center; color: #38bdf8; margin-bottom: 20px; font-size: 1.4rem; }
        .form-group { margin-bottom: 15px; }
        label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 6px; }
        select, input { width: 100%; background: #0f172a; border: 1px solid #475569; border-radius: 8px; padding: 10px 14px; color: #f8fafc; }
        select:focus, input:focus { outline: none; border-color: #38bdf8; }
        .btn { width: 100%; padding: 12px; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 10px; background: #4ade80; color: #0f172a; }
        .status-msg { margin-top: 15px; text-align: center; font-size: 0.9rem; font-weight: 600; }
        .success { color: #4ade80; } .error { color: #f87171; }
      </style>
    </head>
    <body>
      <div class="settings-card">
        <h2>🔑 Password Management</h2>
        <div class="form-group">
          <label>Select Role</label>
          <select id="userRole">
            <option value="Admin">Admin</option>
            <option value="Teacher">Teacher</option>
          </select>
        </div>
        <div class="form-group">
          <label>Master Security Token</label>
          <input type="password" id="masterToken" placeholder="Enter master authorization pin">
        </div>
        <div class="form-group">
          <label>New Password</label>
          <input type="password" id="newPassword" placeholder="Enter new password">
        </div>
        <button class="btn" onclick="updatePortalPassword()">Apply Password Change</button>
        <div id="statusUpdate" class="status-msg"></div>
      </div>
      <script>
        async function updatePortalPassword() {
          const role = document.getElementById('userRole').value;
          const token = document.getElementById('masterToken').value;
          const password = document.getElementById('newPassword').value;
          const status = document.getElementById('statusUpdate');
          if(!token || !password) { status.innerHTML = "<span class='error'>❌ Fill all fields!</span>"; return; }
          status.innerHTML = "⏳ Updating Cloud Database...";
          try {
            const res = await fetch('/api/update-portal-password', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ role, token, password })
            });
            const out = await res.json();
            if(out.success) {
              status.innerHTML = "<span class='success'>✓ " + role + " Password Changed Successfully!</span>";
              document.getElementById('masterToken').value = '';
              document.getElementById('newPassword').value = '';
            } else {
              status.innerHTML = "<span class='error'>❌ " + out.message + "</span>";
            }
          } catch(err) { status.innerHTML = "<span class='error'>❌ Connection Error!</span>"; }
        }
      </script>
    </body>
    </html>
  `);
});

router.post("/api/update-portal-password", async (req, res) => {
  try {
    const { role, token, password } = req.body;
    if (token !== "sumit_master_2026") {
      return res.status(401).json({ success: false, message: "Invalid Master Security Token!" });
    }
    await Credential.findOneAndUpdate({ role: role }, { password: password }, { upsert: true });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dynamic UI Injector Engine (With LocalStorage Memory + Clear Session Button)
router.use((req, res, next) => {
  if (req.path === "/") {
    const originalSend = res.send;
    res.send = function (html) {
      if (typeof html === "string") {
        const themeAndChatStyles = `
          <style>
            body { background-color: #f0f4f8 !important; color: #1e293b !important; }
            .header h1 { color: #0284c7 !important; }
            .header p { color: #64748b !important; }
            .nav-btn { background: #ffffff !important; border: 2px solid #cbd5e1 !important; color: #0f172a !important; }
            .nav-btn.active { border-color: #0284c7 !important; background: #e0f2fe !important; box-shadow: 0 0 15px rgba(2, 132, 199, 0.2) !important; color: #0284c7 !important; }
            .card { background: #ffffff !important; border: 1px solid #e2e8f0 !important; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important; }
            h2 { color: #0f172a !important; border-bottom: 1px solid #e2e8f0 !important; }
            label { color: #64748b !important; }
            input { background: #f8fafc !important; border: 1px solid #cbd5e1 !important; color: #0f172a !important; }
            input:focus { border-color: #0284c7 !important; }
            .marksheet { background: #f8fafc !important; border: 1px dashed #cbd5e1 !important; color: #0f172a !important; }
            .marksheet-header { border-bottom: 1px solid #cbd5e1 !important; color: #0f172a !important; }
            .marksheet-row { color: #334155 !important; }
            .total-row { border-top: 1px solid #cbd5e1 !important; color: #0284c7 !important; }
            .captcha-box { border: 1px solid #e2e8f0 !important; background: #f8fafc !important; color: #64748b !important; }
            .admin-controls { background: #f8fafc !important; border: 1px dashed #8b5cf6 !important; }
            .stat-card { background: #ffffff !important; border: 1px solid #e2e8f0 !important; color: #0f172a !important; }
            .db-table th { color: #0284c7 !important; background: #f1f5f9 !important; }
            .db-table td { border-bottom: 1px solid #e2e8f0 !important; color: #334155 !important; }
            .view-records-container { background: #ffffff !important; border: 1px solid #e2e8f0 !important; }

            #uniChatbotContainer { position: fixed; bottom: 20px; right: 20px; z-index: 99999; font-family: 'Segoe UI', sans-serif; }
            #uniChatLauncher { background: #0284c7; color: white; border: none; width: 60px; height: 60px; border-radius: 50%; cursor: pointer; font-size: 1.6rem; box-shadow: 0 4px 12px rgba(2,132,199,0.4); display: flex; align-items: center; justify-content: center; }
            #uniChatBox { width: 340px; height: 430px; background: white; border: 1px solid #cbd5e1; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); display: none; flex-direction: column; overflow: hidden; }
            .chat-header { background: #0284c7; color: white; padding: 15px; font-weight: 600; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; }
            .chat-header-actions { display: flex; align-items: center; gap: 12px; }
            .chat-action-btn { background: none; border: none; color: white; cursor: pointer; font-size: 1.1rem; padding: 2px; }
            .chat-logs { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #f8fafc; font-size: 0.85rem; }
            .chat-msg { padding: 8px 12px; border-radius: 12px; max-width: 80%; line-height: 1.4; white-space: pre-wrap; }
            .chat-msg.bot { background: #e2e8f0; color: #0f172a; align-self: flex-start; border-bottom-left-radius: 4px; }
            .chat-msg.user { background: #e0f2fe; color: #0284c7; align-self: flex-end; border-bottom-right-radius: 4px; }
            .chat-input-area { display: flex; padding: 10px; border-top: 1px solid #e2e8f0; background: white; }
            .chat-input-area input { flex: 1; border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 6px; font-size: 0.85rem; background: #fff !important; color: #0f172a !important; }
            .chat-send-btn { background: #0284c7; color: white; border: none; padding: 0 14px; margin-left: 8px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; }
          </style>
        `;

        const chatbotHtml = `
          <div id="uniChatbotContainer">
            <button id="uniChatLauncher" onclick="toggleUniChat()">💬</button>
            <div id="uniChatBox">
              <div class="chat-header">
                <span>🏫 SITM Campus AI Assistant</span>
                <div class="chat-header-actions">
                  <button title="Clear Conversation" class="chat-action-btn" onclick="clearUniChatMemory()">🗑️</button>
                  <button class="chat-action-btn" onclick="toggleUniChat()" style="font-weight:bold;">×</button>
                </div>
              </div>
              <div id="uniChatLogs" class="chat-logs">
                <div class="chat-msg bot">Hello! I am your SITM Campus AI Assistant. 🚀 Ask me any query!</div>
              </div>
              <div class="chat-input-area">
                <input type="text" id="uniChatInput" placeholder="Ask anything..." onkeypress="handleChatKey(event)">
                <button class="chat-send-btn" onclick="sendUniChatMessage()">Send</button>
              </div>
            </div>
          </div>
        `;

        const chatbotLogicScript = `
          <script>
            let currentChatHistory = JSON.parse(localStorage.getItem('sitm_chat_memory')) || [];

            window.addEventListener('DOMContentLoaded', () => {
              const logs = document.getElementById('uniChatLogs');
              if(currentChatHistory.length > 0) {
                // Clear the default template welcome message if older logs are active
                logs.innerHTML = '';
                currentChatHistory.forEach(msg => {
                  const type = msg.role === 'user' ? 'user' : 'bot';
                  const div = document.createElement('div');
                  div.className = 'chat-msg ' + type;
                  div.innerText = msg.content;
                  logs.appendChild(div);
                });
                logs.scrollTop = logs.scrollHeight;
              }
            });

            function toggleUniChat() {
              const box = document.getElementById('uniChatBox');
              const launcher = document.getElementById('uniChatLauncher');
              if(box.style.display === 'none' || box.style.display === '') {
                box.style.display = 'flex'; launcher.style.display = 'none';
              } else {
                box.style.display = 'none'; launcher.style.display = 'flex';
              }
            }

            function handleChatKey(e) { if(e.key === 'Enter') sendUniChatMessage(); }
            
            // 🗑️ FUNCTION TO WIPE STORAGE AND RESET SCREEN
            function clearUniChatMemory() {
              if(confirm("Kya aap poori chat history delete karna chahte hain?")) {
                localStorage.removeItem('sitm_chat_memory');
                currentChatHistory = [];
                const logs = document.getElementById('uniChatLogs');
                logs.innerHTML = '<div class="chat-msg bot">Hello! I am your SITM Campus AI Assistant. 🚀 Memory cleared! Ask me anything fresh.</div>';
              }
            }

            async function sendUniChatMessage() {
              const input = document.getElementById('uniChatInput');
              const text = input.value.trim();
              if(!text) return;
              
              appendMsg(text, 'user');
              input.value = '';
              appendMsg("⏳ Thinking...", 'bot-loading');
              
              try {
                const res = await fetch('/api/chat-ai', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ 
                    question: text,
                    history: currentChatHistory 
                  })
                });
                const out = await res.json();
                removeLoadingMsg();
                appendMsg(out.reply, 'bot');
                
                currentChatHistory.push({ role: "user", content: text });
                currentChatHistory.push({ role: "assistant", content: out.reply });
                
                if(currentChatHistory.length > 28) {
                  currentChatHistory.shift(); currentChatHistory.shift();
                }
                
                localStorage.setItem('sitm_chat_memory', JSON.stringify(currentChatHistory));
                
              } catch(err) {
                removeLoadingMsg();
                appendMsg("System connection delay.", 'bot');
              }
            }

            function appendMsg(txt, sender) {
              const logs = document.getElementById('uniChatLogs');
              const msg = document.createElement('div');
              msg.className = 'chat-msg ' + (sender === 'bot-loading' ? 'bot' : sender);
              if(sender === 'bot-loading') msg.id = 'chatLoading';
              msg.innerText = txt;
              logs.appendChild(msg);
              logs.scrollTop = logs.scrollHeight;
            }

            function removeLoadingMsg() {
              const loadEl = document.getElementById('chatLoading');
              if(loadEl) loadEl.remove();
            }
          </script>
        `;

        html = html.replace("</head>", themeAndChatStyles + "</head>");
        html = html.replace("</body>", chatbotHtml + chatbotLogicScript + "</body>");
      }
      originalSend.call(this, html);
    };
  }
  next();
});

router.post("/api/chat-ai", async (req, res) => {
  try {
    const { question, history } = req.body;
    
    let messagePayload = [
      { 
        role: "system", 
        content: "You are the SITM Campus AI Assistant. The current year is strictly 2026. Keep this timeline alignment in mind for all responses. Maintain full continuous awareness of the conversation history provided by the user." 
      }
    ];

    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        if(msg.role && msg.content) {
          messagePayload.push({ role: msg.role, content: msg.content });
        }
      });
    }

    messagePayload.push({ role: "user", content: question });

    const postData = JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: messagePayload
    });

    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + groqKey,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const apiReq = https.request(options, (apiRes) => {
      let responseBody = '';
      apiRes.on('data', (chunk) => { responseBody += chunk; });
      apiRes.on('end', () => {
        try {
          const data = JSON.parse(responseBody);
          let extractedText = "";
          
          if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            extractedText = data.choices[0].message.content;
          } else if (data.error) {
            extractedText = "Engine Error: " + data.error.message;
          } else {
            extractedText = "Response matrix shifting error.";
          }
          
          res.status(200).json({ reply: extractedText });
        } catch (e) {
          res.status(200).json({ reply: "JSON structural alignment issue." });
        }
      });
    });

    apiReq.on('error', (e) => {
      res.status(500).json({ reply: "Handshake transmission failure: " + e.message });
    });

    apiReq.write(postData);
    apiReq.end();

  } catch (error) {
    res.status(500).json({ reply: "Internal tracking stack error: " + error.message });
  }
});

module.exports = router;
