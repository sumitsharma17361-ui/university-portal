const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

router.use((req, res, next) => {
  if (req.path === "/") {
    const originalSend = res.send;
    res.send = function (html) {
      if (typeof html === "string") {
        const themeAndChatStyles = `
          <style>
            #uniChatbotContainer { position: fixed; bottom: 20px; right: 20px; z-index: 99999; font-family: 'Segoe UI', sans-serif; }
            #uniChatLauncher { background: #38bdf8; color: #0f172a; border: none; width: 60px; height: 60px; border-radius: 50%; cursor: pointer; font-size: 1.6rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4); }
            #uniChatBox { width: 350px; height: 460px; background: #1e293b; border: 1px solid #334155; border-radius: 16px; box-shadow: 0 12px 32px rgba(0,0,0,0.5); display: none; flex-direction: column; overflow: hidden; }
            .chat-header { background: #0f172a; color: #38bdf8; padding: 15px; font-weight: 600; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; }
            .chat-header-actions { display: flex; align-items: center; gap: 14px; }
            .chat-action-btn { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1.1rem; }
            .chat-logs { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #0f172a; font-size: 0.85rem; }
            .chat-msg { padding: 10px 14px; border-radius: 12px; max-width: 85%; line-height: 1.4; white-space: pre-wrap; }
            .chat-msg.bot { background: #1e293b; color: #f8fafc; align-self: flex-start; border: 1px solid #334155; }
            .chat-msg.user { background: #38bdf8; color: #0f172a; align-self: flex-end; font-weight: 500; }
            .chat-input-area { display: flex; padding: 12px; border-top: 1px solid #334155; background: #1e293b; }
            .chat-input-area input { flex: 1; border: 1px solid #475569; padding: 10px 14px; border-radius: 8px; font-size: 0.85rem; color: #f8fafc !important; background: #0f172a !important; }
            .chat-send-btn { background: #38bdf8; color: #0f172a; border: none; padding: 0 16px; margin-left: 8px; border-radius: 8px; cursor: pointer; font-weight: 600; }
          </style>
        `;

        const chatbotHtml = `
          <div id="uniChatbotContainer">
            <button id="uniChatLauncher" onclick="toggleUniChat()">💬</button>
            <div id="uniChatBox">
              <div class="chat-header">
                <span id="uniBotTitle">🏫 SITM Portal Assistant</span>
                <div class="chat-header-actions">
                  <button title="Clear" class="chat-action-btn" onclick="clearUniChatMemory()">🗑️</button>
                  <button class="chat-action-btn" onclick="toggleUniChat()">×</button>
                </div>
              </div>
              <div id="uniChatLogs" class="chat-logs">
                <div class="chat-msg bot">Welcome! Enter a Roll Number to quickly check student details.</div>
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
            
            function toggleUniChat() {
              const box = document.getElementById('uniChatBox'), l = document.getElementById('uniChatLauncher');
              if(box.style.display === 'none' || !box.style.display) { box.style.display = 'flex'; l.style.display = 'none'; }
              else { box.style.display = 'none'; l.style.display = 'flex'; }
            }
            function handleChatKey(e) { if(e.key === 'Enter') sendUniChatMessage(); }
            function clearUniChatMemory() {
              localStorage.removeItem('sitm_chat_memory'); currentChatHistory = [];
              document.getElementById('uniChatLogs').innerHTML = '<div class="chat-msg bot">Context flushed cleanly.</div>';
            }
            async function sendUniChatMessage() {
              const input = document.getElementById('uniChatInput'), text = input.value.trim(), logs = document.getElementById('uniChatLogs');
              if(!text) return;
              const u = document.createElement('div'); u.className = 'chat-msg user'; u.innerText = text; logs.appendChild(u); input.value = '';
              const load = document.createElement('div'); load.className = 'chat-msg bot'; load.innerText = '⏳ Checking...'; logs.appendChild(load); logs.scrollTop = logs.scrollHeight;
              
              try {
                const res = await fetch('/api/chat-ai', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ question: text, history: currentChatHistory })
                });
                const out = await res.json(); load.remove();
                const b = document.createElement('div'); b.className = 'chat-msg bot'; b.innerText = out.reply; logs.appendChild(b);
                currentChatHistory.push({ role: "user", content: text }); currentChatHistory.push({ role: "assistant", content: out.reply });
                localStorage.setItem('sitm_chat_memory', JSON.stringify(currentChatHistory)); logs.scrollTop = logs.scrollHeight;
              } catch(err) { load.innerText = "Transmission loss."; }
            }
          </script>
        `;
        html = html.replace("</head>", themeAndChatStyles + "</head>").replace("</body>", chatbotHtml + chatbotLogicScript + "</body>");
      }
      originalSend.call(this, html);
    };
  }
  next();
});

router.post("/api/chat-ai", async (req, res) => {
  try {
    const { question } = req.body;
    const match = question.match(/\\b\\d{1,4}\\b/);
    if (match) {
      const StudentModel = mongoose.model("Student");
      const d = await StudentModel.findOne({ roll: match[0] });
      if (d) {
        const total = d.subjects.java + d.subjects.rProg + d.subjects.os + d.subjects.coa + d.subjects.unixLinux;
        return res.status(200).json({ 
          reply: \`👤 Name: \${d.name}\\n🔢 Roll: \${d.roll}\\n📅 DOB: \${d.dob}\\n📈 Grand Total: \${total}/500\` 
        });
      }
      return res.status(200).json({ reply: \`❌ Roll \${match[0]} ka data nahi mila.\` });
    }
    return res.status(200).json({ reply: "SITM Database AI Desk active. System normal." });
  } catch (error) { res.status(500).json({ reply: "Glitch detected." }); }
});

module.exports = router;
