const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const https = require("https");

// Re-using the exact Student model compiled in server.js
const Student = mongoose.models.Student || mongoose.model("Student", new mongoose.Schema({
  roll: { type: String, required: true, unique: true },
  dob: { type: String, required: true },
  name: { type: String, required: true },
  course: { type: String, default: "B.Tech CSE" },
  subjects: {
    java: Number,
    rProg: Number,
    os: Number,
    coa: Number,
    unixLinux: Number
  },
  uploadedAt: { type: Date, default: Date.now }
}));

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

// Dynamic UI Injector Engine
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
                <span>🏫 SITM Live DB Assistant</span>
                <div class="chat-header-actions">
                  <button title="Clear Conversation" class="chat-action-btn" onclick="clearUniChatMemory()">🗑️</button>
                  <button class="chat-action-btn" onclick="toggleUniChat()" style="font-weight:bold;">×</button>
                </div>
              </div>
              <div id="uniChatLogs" class="chat-logs">
                <div class="chat-msg bot">Hello! I am your SITM Database Aware Assistant. 🚀 Students can ask for marks by roll number. Teachers can update marks via secret pins!</div>
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
            
            function clearUniChatMemory() {
              if(confirm("Kya aap poori chat history delete karna chahte hain?")) {
                localStorage.removeItem('sitm_chat_memory');
                currentChatHistory = [];
                document.getElementById('uniChatLogs').innerHTML = '<div class="chat-msg bot">Hello! Memory cleared. Ask me anything fresh.</div>';
              }
            }

            async function sendUniChatMessage() {
              const input = document.getElementById('uniChatInput');
              const text = input.value.trim();
              if(!text) return;
              
              appendMsg(text, 'user');
              input.value = '';
              appendMsg("⏳ Processing Request...", 'bot-loading');
              
              try {
                const res = await fetch('/api/chat-ai', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ question: text, history: currentChatHistory })
                });
                const out = await res.json();
                removeLoadingMsg();
                appendMsg(out.reply, 'bot');
                
                currentChatHistory.push({ role: "user", content: text });
                currentChatHistory.push({ role: "assistant", content: out.reply });
                if(currentChatHistory.length > 20) { currentChatHistory.shift(); currentChatHistory.shift(); }
                localStorage.setItem('sitm_chat_memory', JSON.stringify(currentChatHistory));
              } catch(err) {
                removeLoadingMsg();
                appendMsg("Server synchronization delay.", 'bot');
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

// 🎯 ADVANCED FUNCTION CALLING/INTENT EXTRACTOR AI ROUTER
router.post("/api/chat-ai", async (req, res) => {
  try {
    const { question, history } = req.body;
    const lowerQ = question.toLowerCase();

    // 🕵️ INTENT 1: STUDENT SEARCHING MARKS DIRECTLY VIA AI
    if (lowerQ.includes("roll") || lowerQ.includes("marks") || lowerQ.includes("result")) {
      const match = question.match(/\d+/); // Extract numbers out of query string
      if (match) {
        const extractedRoll = match[0];
        const studentData = await Student.findOne({ roll: extractedRoll });
        
        if (studentData) {
          const sub = studentData.subjects;
          const total = sub.java + sub.rProg + sub.os + sub.coa + sub.unixLinux;
          const formattedReply = `📊 *Result Found for Roll No: ${studentData.roll}*\n\n` +
                                 `👤 Name: ${studentData.name}\n` +
                                 `📚 Course: ${studentData.course}\n` +
                                 `---------------------------\n` +
                                 `🔹 Java Programming: ${sub.java}/100\n` +
                                 `🔹 R Programming: ${sub.rProg}/100\n` +
                                 `🔹 Operating Systems: ${sub.os}/100\n` +
                                 `🔹 Computer Org & Arch: ${sub.coa}/100\n` +
                                 `🔹 Unix / Linux Lab: ${sub.unixLinux}/100\n` +
                                 `---------------------------\n` +
                                 `🏆 Grand Total: ${total}/500 (${((total/500)*100).toFixed(2)}%)`;
          return res.status(200).json({ reply: formattedReply });
        } else {
          return res.status(200).json({ reply: `❌ Roll Number ${extractedRoll} ka koi record server database me nahi mila.` });
        }
      }
    }

    // 🔐 INTENT 2: TEACHERS UPLOADING/UPDATING MARKS VIA AI
    // Format: "Add result roll: 101, pin: cse_teacher_2026, name: Amit, dob: 22/08/2005, java: 85, rprog: 90, os: 78, coa: 88, unix: 92"
    if ((lowerQ.includes("add") || lowerQ.includes("update") || lowerQ.includes("upload")) && lowerQ.includes("pin")) {
      try {
        const pinMatch = question.match(/pin:\s*([^\s,]+)/i);
        const rollMatch = question.match(/roll:\s*([^\s,]+)/i);
        const nameMatch = question.match(/name:\s*([^,]+)/i);
        const dobMatch = question.match(/dob:\s*([^\s,]+)/i);
        
        const javaMatch = question.match(/java:\s*(\d+)/i);
        const rMatch = question.match(/rprog:\s*(\d+)/i);
        const osMatch = question.match(/os:\s*(\d+)/i);
        const coaMatch = question.match(/coa:\s*(\d+)/i);
        const unixMatch = question.match(/unix:\s*(\d+)/i);

        if (!pinMatch || !rollMatch || !nameMatch || !dobMatch) {
          return res.status(200).json({ reply: "❌ Syntax Mismatch! Marks add karne ke liye formats use karein:\n\n*Add result roll: 12, pin: cse_teacher_2026, name: Sumit, dob: 22/08/2005, java: 90, rprog: 85, os: 80, coa: 75, unix: 95*" });
        }

        const authPin = pinMatch[1].trim();
        if (authPin !== "cse_teacher_2026" && authPin !== "admin_secure_2026") {
          return res.status(200).json({ reply: "❌ Operation Denied: Invalid Security Pin provided!" });
        }

        const targetRoll = rollMatch[1].trim();
        const targetName = nameMatch[1].trim();
        const targetDob = dobMatch[1].trim();

        const subjectsObj = {
          java: javaMatch ? Number(javaMatch[1]) : 0,
          rProg: rMatch ? Number(rMatch[1]) : 0,
          os: osMatch ? Number(osMatch[1]) : 0,
          coa: coaMatch ? Number(coaMatch[1]) : 0,
          unixLinux: unixMatch ? Number(unixMatch[1]) : 0
        };

        await Student.findOneAndUpdate(
          { roll: targetRoll },
          { name: targetName, dob: targetDob, subjects: subjectsObj, uploadedAt: new Date() },
          { upsert: true }
        );

        return res.status(200).json({ reply: `✅ Success! Roll Number ${targetRoll} (${targetName}) ke marks secure cloud database me update ho gaye hain.` });
      } catch (err) {
        return res.status(200).json({ reply: "❌ Internal processing error while inserting database variables." });
      }
    }

    // 🤖 INTENT 3: STANDARD AI CONVERSATION IF NO DATABASE TRIGGER DETECTED
    let messagePayload = [
      { 
        role: "system", 
        content: "You are the SITM Campus AI Assistant. The current year is strictly 2026. If users ask for marks or updating records, remind them to provide the roll number or the formal format structure with a security pin." 
      }
    ];

    if (history && Array.isArray(history)) {
      history.forEach(msg => { if(msg.role && msg.content) messagePayload.push({ role: msg.role, content: msg.content }); });
    }
    messagePayload.push({ role: "user", content: question });

    const postData = JSON.stringify({ model: "llama-3.3-70b-versatile", messages: messagePayload });

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
          res.status(200).json({ reply: data.choices[0].message.content });
        } catch (e) { res.status(200).json({ reply: "JSON transit mismatch." }); }
      });
    });

    apiReq.write(postData);
    apiReq.end();

  } catch (error) {
    res.status(500).json({ reply: "Internal tracking server fault." });
  }
});

module.exports = router;
