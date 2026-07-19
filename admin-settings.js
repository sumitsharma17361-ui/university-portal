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
            #uniChatbotContainer { position: fixed; bottom: 20px; right: 20px; z-index: 99999; font-family: 'Segoe UI', sans-serif; }
            #uniChatLauncher { background: #38bdf8; color: #0f172a; border: none; width: 60px; height: 60px; border-radius: 50%; cursor: pointer; font-size: 1.6rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.4); }
            #uniChatBox { width: 340px; height: 440px; background: #1e293b; border: 1px solid #334155; border-radius: 16px; box-shadow: 0 12px 32px rgba(0,0,0,0.5); display: none; flex-direction: column; overflow: hidden; }
            .chat-header { background: #0f172a; color: #38bdf8; padding: 15px; font-weight: 600; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; }
            .chat-header-actions { display: flex; align-items: center; gap: 14px; }
            .chat-action-btn { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1.1rem; }
            .chat-action-btn:hover { color: #f8fafc; }
            .chat-logs { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #0f172a; font-size: 0.85rem; }
            .chat-msg { padding: 10px 14px; border-radius: 12px; max-width: 85%; line-height: 1.4; white-space: pre-wrap; }
            .chat-msg.bot { background: #1e293b; color: #f8fafc; align-self: flex-start; border: 1px solid #334155; }
            .chat-msg.user { background: #38bdf8; color: #0f172a; align-self: flex-end; font-weight: 500; }
            .chat-input-area { display: flex; padding: 12px; border-top: 1px solid #334155; background: #1e293b; }
            .chat-input-area input { flex: 1; border: 1px solid #475569; padding: 10px 14px; border-radius: 8px; font-size: 0.85rem; color: #f8fafc !important; background: #0f172a !important; }
            .chat-input-area input:focus { outline: none; border-color: #38bdf8; }
            .chat-send-btn { background: #38bdf8; color: #0f172a; border: none; padding: 0 16px; margin-left: 8px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; }
          </style>
        `;

        const chatbotHtml = `
          <div id="uniChatbotContainer">
            <button id="uniChatLauncher" onclick="toggleUniChat()">💬</button>
            <div id="uniChatBox">
              <div class="chat-header">
                <span id="uniBotTitle">🏫 SITM Portal Assistant</span>
                <div class="chat-header-actions">
                  <button title="Clear Conversation" class="chat-action-btn" onclick="clearUniChatMemory()">🗑️</button>
                  <button class="chat-action-btn" onclick="toggleUniChat()">×</button>
                </div>
              </div>
              <div id="uniChatLogs" class="chat-logs">
                <div class="chat-msg bot">Hello! I am your SITM Database Integrated Assistant. 🚀 Give a roll number to check performance analytics instantly!</div>
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
              const fullText = document.body.innerText.toLowerCase();
              
              const inputs = Array.from(document.querySelectorAll('input, label'));
              const hasTeacherFormFields = inputs.some(el => {
                const txt = (el.textContent || el.placeholder || "").toLowerCase();
                return txt.includes("student name") || txt.includes("date of birth") || txt.includes("subjects");
              });

              if (fullText.includes("records dashboard") && hasTeacherFormFields) {
                titleEl.innerText = "🛡️ Professor Console (Teacher)";
                window.activeSessionRoleGlobal = "Teacher";
              } else {
                titleEl.innerText = "🏫 SITM Portal Assistant";
                window.activeSessionRoleGlobal = "Student";
              }
            }, 300);

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
              if(confirm("Wipe conversation data?")) {
                localStorage.removeItem('sitm_chat_memory'); currentChatHistory = [];
                document.getElementById('uniChatLogs').innerHTML = '<div class="chat-msg bot">Context flushed cleanly. Ask me anything fresh!</div>';
              }
            }
            async function sendUniChatMessage() {
              const input = document.getElementById('uniChatInput'), text = input.value.trim(), logs = document.getElementById('uniChatLogs');
              if(!text) return;
              
              const currentActiveRole = window.activeSessionRoleGlobal || "Student";

              const u = document.createElement('div'); u.className = 'chat-msg user'; u.innerText = text; logs.appendChild(u); input.value = '';
              const load = document.createElement('div'); load.className = 'chat-msg bot'; load.innerText = '⏳ Syncing Data...'; logs.appendChild(load); logs.scrollTop = logs.scrollHeight;
              
              try {
                const res = await fetch('/api/chat-ai', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ question: text, history: currentChatHistory, portalRole: currentActiveRole })
                });
                const out = await res.json(); load.remove();
                const b = document.createElement('div'); b.className = 'chat-msg bot'; b.innerText = out.reply; logs.appendChild(b);
                currentChatHistory.push({ role: "user", content: text }); currentChatHistory.push({ role: "assistant", content: out.reply });
                if(currentChatHistory.length > 20) { currentChatHistory.shift(); currentChatHistory.shift(); }
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

// 🎯 MAIN ROUTER ENTRY
router.post("/api/chat-ai", async (req, res) => {
  try {
    const { question, history, portalRole } = req.body;
    const lowerQ = question.toLowerCase();
    const StudentModel = mongoose.model("Student");
    const ConfigModel = mongoose.model("Config");

    const isTeacherIntendingUpload = lowerQ.includes("add") || lowerQ.includes("update") || lowerQ.includes("upload") || lowerQ.includes("kardo") || lowerQ.includes("set") || lowerQ.includes("change");
    const hasAuthorizedPortalSession = (portalRole === "Teacher" || portalRole === "Admin" || portalRole === "Professor") || lowerQ.includes("pin: cse_teacher_2026") || lowerQ.includes("pin: admin_secure_2026");

    if (isTeacherIntendingUpload && !hasAuthorizedPortalSession) {
      return res.status(200).json({ reply: "🛑 Operation Denied: Security Privilege Mismatch! Students are strictly prohibited from mutating cloud cluster records." });
    }

    // ⭐ NEW ADDITION: DIRECT CHATBOX DATE OF BIRTH (DOB) LIVE MUTATION LAYER
    if (isTeacherIntendingUpload && hasAuthorizedPortalSession && (lowerQ.includes("dob") || lowerQ.includes("birth") || lowerQ.includes("date"))) {
      const rollMatch = question.match(/(?:roll|no|number)\s*[:\s]*(\d+)/i) || question.match(/\b\d{2}\b/);
      const dobMatch = question.match(/(\d{2}\/\d{2}\/\d{4})/);

      if (rollMatch && dobMatch) {
        const targetRoll = rollMatch[1] || rollMatch[0];
        const targetDob = dobMatch[1];

        const updatedDoc = await StudentModel.findOneAndUpdate(
          { roll: targetRoll },
          { $set: { dob: targetDob, uploadedAt: new Date() } },
          { new: true }
        );

        if (updatedDoc) {
          return res.status(200).json({ 
            reply: `🎯 Live DOB Update Applied Successfully!\n\nRoll Number ${targetRoll} (${updatedDoc.name}) ki Date of Birth database mein update karke successfully *${targetDob}* kar di gayi hai.` 
          });
        } else {
          return res.status(200).json({ reply: `❌ Roll Number ${targetRoll} database mein exist nahi karta hai.` });
        }
      }
    }

    // ⭐ PRIORITY 1: SMART SINGLE SUBJECT PARTIAL UPDATE LOGIC
    if (isTeacherIntendingUpload && hasAuthorizedPortalSession && (lowerQ.includes("java") || lowerQ.includes("rprog") || lowerQ.includes("os") || lowerQ.includes("coa") || lowerQ.includes("unix"))) {
      const allNumbers = question.match(/\d+/g);
      const rollMatch = question.match(/(?:roll|no|number)\s*[:\s]*(\d+)/i) || (allNumbers ? { 1: allNumbers[0] } : null);

      if (rollMatch && allNumbers && allNumbers.length >= 2) {
        const targetRoll = rollMatch[1];
        let targetScore = null;
        for (let num of allNumbers) {
          if (num !== targetRoll && num.length <= 3) { targetScore = Number(num); break; }
        }

        if (targetScore !== null && targetScore >= 0 && targetScore <= 100) {
          let updateField = "";
          if (lowerQ.includes("java")) updateField = "subjects.java";
          else if (lowerQ.includes("rprog") || lowerQ.includes(" r ")) updateField = "subjects.rProg";
          else if (lowerQ.includes("os") || lowerQ.includes("operating")) updateField = "subjects.os";
          else if (lowerQ.includes("coa") || lowerQ.includes("architecture")) updateField = "subjects.coa";
          else if (lowerQ.includes("unix") || lowerQ.includes("linux")) updateField = "subjects.unixLinux";

          if (updateField) {
            let updateObject = {};
            updateObject[updateField] = targetScore;
            updateObject["uploadedAt"] = new Date();

            const updatedDoc = await StudentModel.findOneAndUpdate({ roll: targetRoll }, { $set: updateObject }, { new: true });
            if (updatedDoc) {
              return res.status(200).json({ reply: `🎯 Live Update Applied Successfully!\n\nRoll Number ${targetRoll} ke database mein ${updateField.split('.')[1]} ko update karke ${targetScore} kar diya hai.` });
            }
          }
        }
      }
    }

    // ⭐ PRIORITY 2: BULK FULL RECORD INSERT/UPDATE LOGIC
    if (isTeacherIntendingUpload && hasAuthorizedPortalSession && lowerQ.includes("name:") && lowerQ.includes("dob:")) {
      const rollM = question.match(/roll:\s*([^\s,]+)/i);
      const nameM = question.match(/name:\s*([^,]+)/i), dobM = question.match(/dob:\s*([^\s,]+)/i);
      const jM = question.match(/java:\s*(\d+)/i), rM = question.match(/rprog:\s*(\d+)/i);
      const oM = question.match(/os:\s*(\d+)/i), cM = question.match(/coa:\s*(\d+)/i), uM = question.match(/unix:\s*(\d+)/i);

      if (rollM && nameM && dobM) {
        await StudentModel.findOneAndUpdate({ roll: rollM[1].trim() }, {
          name: nameM[1].trim(), dob: dobM[1].trim(), uploadedAt: new Date(),
          subjects: { java: jM?Number(jM[1]):0, rProg: rM?Number(rM[1]):0, os: oM?Number(oM[1]):0, coa: cM?Number(cM[1]):0, unixLinux: uM?Number(uM[1]):0 }
        }, { upsert: true });
        return res.status(200).json({ reply: `✅ Full Registry Synchronized! Roll Number ${rollM[1].trim()} records are safe in Cloud Cluster.` });
      }
    }

    // 🔍 PRIORITY 3: ADVANCED PERFORMANCE SEARCH MARKS LOGIC
    if (lowerQ.includes("roll") || lowerQ.includes("marks") || lowerQ.includes("result")) {
      let globalConfig = await ConfigModel.findOne({ configId: "global" });
      const isSystemWithheld = !globalConfig || !globalConfig.isPublished;

      if (isSystemWithheld && !hasAuthorizedPortalSession) {
        return res.status(200).json({ reply: "❌ Result is currently Hidden/Withheld by Administration." });
      }

      const match = question.match(/\b\d{1,4}\b/);
      if (match) {
        const d = await StudentModel.findOne({ roll: match[0] });
        if (d) {
          const sub = d.subjects;
          const total = sub.java + sub.rProg + sub.os + sub.coa + sub.unixLinux;
          const pct = ((total / 500) * 100).toFixed(2);
          
          const subArray = [
            { name: "Java Programming", score: sub.java }, { name: "R Programming", score: sub.rProg },
            { name: "Operating Systems", score: sub.os }, { name: "Computer Org & Arch", score: sub.coa },
            { name: "Unix / Linux Lab", score: sub.unixLinux }
          ];

          let highestSub = subArray[0]; let failedSubjects = [];
          subArray.forEach(s => {
            if (s.score > highestSub.score) highestSub = s;
            if (s.score < 33) failedSubjects.push(`${s.name} (${s.score}/100)`);
          });

          const status = failedSubjects.length > 0 ? `🔴 FAILED / BACK (${failedSubjects.length} Subject)` : "🟢 PASSED SECURELY";
          const backDetails = failedSubjects.length > 0 ? `⚠️ Back Details:\n- ${failedSubjects.join("\n- ")}` : "🎉 Performance Status: Excellent! Clear pass.";

          return res.status(200).json({ 
            reply: `📊 *Performance Card (Roll: ${d.roll})*\n👤 Name: ${d.name}\n📅 DOB: ${d.dob}\n---------------------------\n🔹 Java: ${sub.java}/100\n🔹 R Prog: ${sub.rProg}/100\n🔹 OS: ${sub.os}/100\n🔹 COA: ${sub.coa}/100\n🔹 Unix: ${sub.unixLinux}/100\n---------------------------\n📈 Grand Total: ${total}/500 (${pct}%)\n⚖️ Status: ${status}\n\n⭐ Highest Subject: ${highestSub.name} (${highestSub.score}/100)\n${backDetails}` 
          });
        }
        return res.status(200).json({ reply: `❌ Roll Number ${match[0]} ka performance data database cluster par active nahi mila.` });
      }
    }

    // 🤖 PRIORITY 4: REGULAR ASSISTANT TALK STACK
    let messagePayload = [{ role: "system", content: "You are the SITM Campus AI Assistant. Keep answers brief. Current year is strictly 2026." }];
    if (history && Array.isArray(history)) {
      history.forEach(m => { if(m.role && m.content) messagePayload.push({ role: m.role, content: m.content }); });
    }
    
    if (history.length === 0 && (portalRole === "Teacher" || portalRole === "Admin")) {
      return res.status(200).json({ reply: `Welcome Professor! 🛡️ System detects active ${portalRole} credentials session. Direct database mutation is authorized.` });
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
        catch (e) { res.status(200).json({ reply: "JSON transit mismatch." }); }
      });
    });
    apiReq.on('error', (e) => res.status(500).json({ reply: "Transmission drop." }));
    apiReq.write(postData); apiReq.end();
  } catch (error) { res.status(500).json({ reply: "Internal engine error." }); }
});

module.exports = router;
