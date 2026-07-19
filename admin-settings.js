const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const https = require("https");

const groqKey = "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"; 

router.get("/admin-settings", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Portal Control Center</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
        body { background-color: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
        .settings-card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 400px; padding: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        h2 { text-align: center; color: #38bdf8; margin-bottom: 20px; font-size: 1.4rem; }
        .form-group { margin-bottom: 15px; }
        label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 6px; }
        select, input { width: 100%; background: #0f172a; border: 1px solid #475569; border-radius: 8px; padding: 10px 14px; color: #f8fafc; }
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
          <select id="userRole"><option value="Admin">Admin</option><option value="Teacher">Teacher</option></select>
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
    </body>
    </html>
  `);
});

router.post("/api/update-portal-password", async (req, res) => {
  try {
    const { role, token, password } = req.body;
    if (token !== "sumit_master_2026") return res.status(401).json({ success: false, message: "Invalid Token" });
    await mongoose.model("Credential").findOneAndUpdate({ role: role }, { password: password }, { upsert: true });
    res.status(200).json({ success: true });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

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
                <div class="chat-msg bot">Welcome to Admission & Examination Desk! Enter Roll Number to query detailed profile data.</div>
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
            window.activeSessionRoleGlobal = "Student";

            setInterval(() => {
              const titleEl = document.getElementById('uniBotTitle');
              if (document.body.innerText.toLowerCase().includes("records dashboard")) {
                titleEl.innerText = "🛡️ Professor Console (Teacher)";
                window.activeSessionRoleGlobal = "Teacher";
              } else {
                titleEl.innerText = "🏫 SITM Portal Assistant";
                window.activeSessionRoleGlobal = "Student";
              }
            }, 300);

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
              const currentActiveRole = window.activeSessionRoleGlobal || "Student";
              const u = document.createElement('div'); u.className = 'chat-msg user'; u.innerText = text; logs.appendChild(u); input.value = '';
              const load = document.createElement('div'); load.className = 'chat-msg bot'; load.innerText = '⏳ Processing Profile...'; logs.appendChild(load); logs.scrollTop = logs.scrollHeight;
              
              try {
                const res = await fetch('/api/chat-ai', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ question: text, history: currentChatHistory, portalRole: currentActiveRole })
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
    const { question, history, portalRole } = req.body;
    const lowerQ = question.toLowerCase();
    const StudentModel = mongoose.model("Student");

    // Profile Lookup Engine via Chat
    if (lowerQ.includes("roll") || lowerQ.includes("detail") || lowerQ.includes("admission")) {
      const match = question.match(/\b\d{1,4}\b/);
      if (match) {
        const d = await StudentModel.findOne({ roll: match[0] });
        if (d) {
          return res.status(200).json({ 
            reply: `📂 *Admission Ledger Card (Roll: ${d.roll})*\n👤 Name: ${d.name}\n📅 DOB: ${d.dob}\n🧬 Gender: ${d.gender || 'N/A'}\n\n👨‍👩‍👦 FAMILY VERIFICATION:\n- Father's Name: ${d.fatherName || 'N/A'}\n- Mother's Name: ${d.motherName || 'N/A'}\n\n📞 CONTACT & IDENTIFICATION:\n- Phone: +91 ${d.phone || 'N/A'}\n- Email: ${d.email || 'N/A'}\n- Aadhaar: XXXX-XXXX-${(d.aadhaar || '0000').slice(-4)}\n- Address: ${d.address || 'N/A'}\n\n🎓 ACADEMIC BACKGROUND:\n- 10th Score: ${d.marks10 || 'N/A'}%\n- 12th Score: ${d.marks12 || 'N/A'}%\n- Branch Allocation: ${d.course}` 
          });
        }
        return res.status(200).json({ reply: `❌ Roll Number ${match[0]} ka verified record server cloud par nahi mila.` });
      }
    }

    // Default Fallback
    return res.status(200).json({ reply: "SITM Server Database Active. Enter a valid Student Roll Number to query full administrative admission profile." });
  } catch (error) { res.status(500).json({ reply: "Internal core engine glitch." }); }
});

module.exports = router;
