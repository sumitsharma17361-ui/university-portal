const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const https = require("https");

// 🔑 GROQ API KEY
const groqKey = "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"; 

// HTML Settings Interface
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
              status.innerHTML = "<span class='success'>✓ Password Changed Successfully!</span>";
              document.getElementById('masterToken').value = '';
              document.getElementById('newPassword').value = '';
            } else { status.innerHTML = "<span class='error'>❌ Failed</span>"; }
          } catch(err) { status.innerHTML = "<span class='error'>❌ Connection Error!</span>"; }
        }
      </script>
    </body>
    </html>
  `);
});

// Password Endpoint
router.post("/api/update-portal-password", async (req, res) => {
  try {
    const { role, token, password } = req.body;
    if (token !== "sumit_master_2026") {
      return res.status(401).json({ success: false, message: "Invalid Token" });
    }
    await mongoose.model("Credential").findOneAndUpdate({ role: role }, { password: password }, { upsert: true });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dynamic Injection Layer
router.use((req, res, next) => {
  if (req.path === "/") {
    const originalSend = res.send;
    res.send = function (html) {
      if (typeof html === "string") {
        const themeAndChatStyles = `
          <style>
            body { background-color: #f0f4f8 !important; color: #1e293b !important; }
            #uniChatbotContainer { position: fixed; bottom: 20px; right: 20px; z-index: 99999; font-family: 'Segoe UI', sans-serif; }
            #uniChatLauncher { background: #0284c7; color: white; border: none; width: 60px; height: 60px; border-radius: 50%; cursor: pointer; font-size: 1.6rem; display: flex; align-items: center; justify-content: center; }
            #uniChatBox { width: 340px; height: 430px; background: white; border: 1px solid #cbd5e1; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); display: none; flex-direction: column; overflow: hidden; }
            .chat-header { background: #0284c7; color: white; padding: 15px; font-weight: 600; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; }
            .chat-header-actions { display: flex; align-items: center; gap: 12px; }
            .chat-action-btn { background: none; border: none; color: white; cursor: pointer; font-size: 1.1rem; }
            .chat-logs { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #f8fafc; font-size: 0.85rem; }
            .chat-msg { padding: 8px 12px; border-radius: 12px; max-width: 80%; line-height: 1.4; white-space: pre-wrap; }
            .chat-msg.bot { background: #e2e8f0; color: #0f172a; align-self: flex-start; }
            .chat-msg.user { background: #e0f2fe; color: #0284c7; align-self: flex-end; }
            .chat-input-area { display: flex; padding: 10px; border-top: 1px solid #e2e8f0; background: white; }
            .chat-input-area input { flex: 1; border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 6px; font-size: 0.85rem; color: #0f172a !important; background: #fff !important; }
            .chat-send-btn { background: #0284c7; color: white; border: none; padding: 0 14px; margin-left: 8px; border-radius: 6px; cursor: pointer; font-weight: 600; }
          </style>
        `;

        const chatbotHtml = `
          <div id="uniChatbotContainer">
            <button id="uniChatLauncher" onclick="toggleUniChat()">💬</button>
            <div id="uniChatBox">
              <div class="chat-header">
                <span>🏫 SITM Live DB Assistant</span>
                <div class="chat-header-actions">
                  <button title="Clear Conversation" class="chat-action-btn" onclick="clearUniChatMemory()">🗑️</button>
                  <button class="chat-action-btn" onclick="toggleUniChat()">×</button>
                </div>
              </div>
              <div id="uniChatLogs" class="chat-logs">
                <div class="chat-msg bot">Hello! I am your SITM Database Assistant. 🚀 Give a roll number to check marks, or provide data with a secure pin to upload results!</div>
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
                logs.innerHTML = '';
                currentChatHistory.forEach(msg => {
                  const div = document.createElement('div');
                  div.className = 'chat-msg ' + (msg.role === 'user' ? 'user' : 'bot');
                  div.innerText = msg.content;
                  logs.appendChild(div);
                });
                logs.scrollTop = logs.scrollHeight;
              }
            });
            function toggleUniChat() {
              const box = document.getElementById('uniChatBox'), l = document.getElementById('uniChatLauncher');
              if(box.style.display === 'none' || !box.style.display) { box.style.display = 'flex'; l.style.display = 'none'; }
              else { box.style.display = 'none'; l.style.display = 'flex'; }
            }
            function handleChatKey(e) { if(e.key === 'Enter') sendUniChatMessage(); }
            function clearUniChatMemory() {
              if(confirm("Delete history?")) {
                localStorage.removeItem('sitm_chat_memory'); currentChatHistory = [];
                document.getElementById('uniChatLogs').innerHTML = '<div class="chat-msg bot">Memory cleared!</div>';
              }
            }
            async function sendUniChatMessage() {
              const input = document.getElementById('uniChatInput'), text = input.value.trim(), logs = document.getElementById('uniChatLogs');
              if(!text) return;
              const u = document.createElement('div'); u.className = 'chat-msg user'; u.innerText = text; logs.appendChild(u); input.value = '';
              const load = document.createElement('div'); load.className = 'chat-msg bot'; load.innerText = '⏳ Processing...'; logs.appendChild(load); logs.scrollTop = logs.scrollHeight;
              try {
                const res = await fetch('/api/chat-ai', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ question: text, history: currentChatHistory })
                });
                const out = await res.json(); load.remove();
                const b = document.createElement('div'); b.className = 'chat-msg bot'; b.innerText = out.reply; logs.appendChild(b);
                currentChatHistory.push({ role: "user", content: text }); currentChatHistory.push({ role: "assistant", content: out.reply });
                if(currentChatHistory.length > 20) { currentChatHistory.shift(); currentChatHistory.shift(); }
                localStorage.setItem('sitm_chat_memory', JSON.stringify(currentChatHistory)); logs.scrollTop = logs.scrollHeight;
              } catch(err) { load.innerText = "Connection delay."; }
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

// 🎯 MAIN ROUTER ENTRY LINKED VIA EXISTING INSTANCE DECOYS
router.post("/api/chat-ai", async (req, res) => {
  try {
    const { question, history } = req.body;
    const lowerQ = question.toLowerCase();
    
    // Dynamically access compiled global student registry model from memory tree
    const StudentModel = mongoose.model("Student");

    // 1. Search Marks Logic
    if (lowerQ.includes("roll") || lowerQ.includes("marks") || lowerQ.includes("result")) {
      const match = question.match(/\d+/);
      if (match) {
        const d = await StudentModel.findOne({ roll: match[0] });
        if (d) {
          const total = d.subjects.java + d.subjects.rProg + d.subjects.os + d.subjects.coa + d.subjects.unixLinux;
          return res.status(200).json({ reply: `📊 *Result Found (Roll: ${d.roll})*\n\n👤 Name: ${d.name}\n📚 Course: ${d.course}\n---------------------------\n🔹 Java: ${d.subjects.java}\n🔹 R Prog: ${d.subjects.rProg}\n🔹 OS: ${d.subjects.os}\n🔹 COA: ${d.subjects.coa}\n🔹 Unix: ${d.subjects.unixLinux}\n---------------------------\n🏆 Total: ${total}/500 (${((total/500)*100).toFixed(2)}%)` });
        }
        return res.status(200).json({ reply: `❌ Roll Number ${match[0]} ka data server cluster par nahi mila.` });
      }
    }

    // 2. Add Marks Logic
    if ((lowerQ.includes("add") || lowerQ.includes("update") || lowerQ.includes("upload")) && lowerQ.includes("pin")) {
      const pinM = question.match(/pin:\s*([^\s,]+)/i), rollM = question.match(/roll:\s*([^\s,]+)/i);
      const nameM = question.match(/name:\s*([^,]+)/i), dobM = question.match(/dob:\s*([^\s,]+)/i);
      const jM = question.match(/java:\s*(\d+)/i), rM = question.match(/rprog:\s*(\d+)/i);
      const oM = question.match(/os:\s*(\d+)/i), cM = question.match(/coa:\s*(\d+)/i), uM = question.match(/unix:\s*(\d+)/i);

      if (!pinM || !rollM || !nameM || !dobM) {
        return res.status(200).json({ reply: "❌ Form Mismatch! Try this strict structure:\nAdd result roll: 12, pin: cse_teacher_2026, name: Sumit, dob: 22/08/2005, java: 90, rprog: 85, os: 80, coa: 75, unix: 95" });
      }
      if (pinM[1].trim() !== "cse_teacher_2026" && pinM[1].trim() !== "admin_secure_2026") {
        return res.status(200).json({ reply: "❌ Security Mismatch: Action unauthorized." });
      }

      await StudentModel.findOneAndUpdate({ roll: rollM[1].trim() }, {
        name: nameM[1].trim(), dob: dobM[1].trim(), uploadedAt: new Date(),
        subjects: { java: jM?Number(jM[1]):0, rProg: rM?Number(rM[1]):0, os: oM?Number(oM[1]):0, coa: cM?Number(cM[1]):0, unixLinux: uM?Number(uM[1]):0 }
      }, { upsert: true });

      return res.status(200).json({ reply: `✅ Verified! Roll Number ${rollM[1].trim()} records are synchronized with Cloud Database.` });
    }

    // 3. Regular Assistant Talk Stack
    let messagePayload = [{ role: "system", content: "You are the SITM Campus AI Assistant. The current year is strictly 2026. Keep this in mind for all responses. Keep responses clean and brief." }];
    if (history && Array.isArray(history)) {
      history.forEach(m => { if(m.role && m.content) messagePayload.push({ role: m.role, content: m.content }); });
    }
    messagePayload.push({ role: "user", content: question });

    const postData = JSON.stringify({ model: "llama-3.3-70b-versatile", messages: messagePayload });
    const apiReq = https.request({
      hostname: 'api.groq.com', path: '/openai/v1/chat/completions', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + groqKey, 'Content-Length': Buffer.byteLength(postData) }
    }, (apiRes) => {
      let body = ''; apiRes.on('data', (c) => body += c);
      apiRes.on('end', () => {
        try { res.status(200).json({ reply: JSON.parse(body).choices[0].message.content }); } 
        catch (e) { res.status(200).json({ reply: "JSON transit parsing error." }); }
      });
    });
    apiReq.on('error', (e) => res.status(500).json({ reply: "Transmission failure." }));
    apiReq.write(postData); apiReq.end();
  } catch (error) { res.status(500).json({ reply: "Internal processing down." }); }
});

module.exports = router;
                                 
