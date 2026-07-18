const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// Database Schema for Credentials
const credentialSchema = new mongoose.Schema({
  role: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Purana model exist karta hai toh use use karega, nahi toh naya banayega
const Credential = mongoose.models.Credential || mongoose.model("Credential", credentialSchema);

// HTML settings portal interface
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

          if(!token || !password) {
            status.innerHTML = "<span class='error'>❌ Fill all fields!</span>"; return;
          }

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
          } catch(err) {
            status.innerHTML = "<span class='error'>❌ Connection Error!</span>";
          }
        }
      </script>
    </body>
    </html>
  `);
});

// API endpoint to change password
router.post("/api/update-portal-password", async (req, res) => {
  try {
    const { role, token, password } = req.body;
    
    // Security layer to prevent unauthorized access
    if (token !== "sumit_master_2026") {
      return res.status(401).json({ success: false, message: "Invalid Master Security Token!" });
    }

    await Credential.findOneAndUpdate(
      { role: role },
      { password: password },
      { upsert: true }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// CSS & AI Chatbot Widget Injector Engine
router.use((req, res, next) => {
  if (req.path === "/") {
    const originalSend = res.send;
    res.send = function (html) {
      if (typeof html === "string") {
        // 1. Premium Theme Styles + Chatbot UI Styles
        const themeAndChatStyles = `
          <style>
            /* Overwriting with Premium White & Blue Theme */
            body { background-color: #f0f4f8 !important; color: #1e293b !important; }
            .header h1 { color: #0284c7 !important; }
            .header p { color: #64748b !important; }
            .nav-btn { background: #ffffff !important; border: 2px solid #cbd5e1 !important; color: #0f172a !important; }
            .nav-btn.active { border-color: #0284c7 !important; background: #e0f2fe !important; box-shadow: 0 0 15px rgba(2, 132, 199, 0.2) !important; color: #0284c7 !important; }
            .card { background: #ffffff !important; border: 1px solid #e2e8f0 !important; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03) !important; }
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

            /* Chatbot UI Design */
            #uniChatbotContainer { position: fixed; bottom: 20px; right: 20px; z-index: 99999; font-family: 'Segoe UI', sans-serif; }
            #uniChatLauncher { background: #0284c7; color: white; border: none; width: 60px; height: 60px; border-radius: 50%; cursor: pointer; font-size: 1.6rem; box-shadow: 0 4px 12px rgba(2,132,199,0.4); display: flex; align-items: center; justify-content: center; }
            #uniChatBox { width: 340px; height: 430px; background: white; border: 1px solid #cbd5e1; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); display: none; flex-direction: column; overflow: hidden; }
            .chat-header { background: #0284c7; color: white; padding: 15px; font-weight: 600; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; }
            .chat-logs { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #f8fafc; font-size: 0.85rem; }
            .chat-msg { padding: 8px 12px; border-radius: 12px; max-width: 80%; line-height: 1.4; }
            .chat-msg.bot { background: #e2e8f0; color: #0f172a; align-self: flex-start; border-bottom-left-radius: 4px; }
            .chat-msg.user { background: #e0f2fe; color: #0284c7; align-self: flex-end; border-bottom-right-radius: 4px; }
            .chat-input-area { display: flex; padding: 10px; border-top: 1px solid #e2e8f0; background: white; }
            .chat-input-area input { flex: 1; border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 6px; font-size: 0.85rem; background: #fff !important; color: #0f172a !important; }
            .chat-send-btn { background: #0284c7; color: white; border: none; padding: 0 14px; margin-left: 8px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; }
          </style>
        `;

        // 2. Chatbot HTML Box Structure
        const chatbotHtml = `
          <div id="uniChatbotContainer">
            <button id="uniChatLauncher" onclick="toggleUniChat()">💬</button>
            <div id="uniChatBox">
              <div class="chat-header">
                <span>🏫 Portal Assistant AI</span>
                <button onclick="toggleUniChat()" style="background:none; border:none; color:white; cursor:pointer; font-weight:bold; font-size:1.1rem;">×</button>
              </div>
              <div id="uniChatLogs" class="chat-logs">
                <div class="chat-msg bot">Hello! Welcome to the Tech University Portal. 👋 How can I help you navigate the system today?</div>
              </div>
              <div class="chat-input-area">
                <input type="text" id="uniChatInput" placeholder="Ask a question..." onkeypress="handleChatKey(event)">
                <button class="chat-send-btn" onclick="sendUniChatMessage()">Send</button>
              </div>
            </div>
          </div>
        `;

        // 3. Chatbot Reply Intelligence Script
        const chatbotLogicScript = `
          <script>
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

            function sendUniChatMessage() {
              const input = document.getElementById('uniChatInput');
              const text = input.value.trim();
              if(!text) return;

              appendMsg(text, 'user');
              input.value = '';

              setTimeout(() => {
                const reply = getBotReply(text.toLowerCase());
                appendMsg(reply, 'bot');
              }, 400);
            }

            function appendMsg(txt, sender) {
              const logs = document.getElementById('uniChatLogs');
              const msg = document.createElement('div');
              msg.className = 'chat-msg ' + sender;
              msg.innerText = txt;
              logs.appendChild(msg);
              logs.scrollTop = logs.scrollHeight;
            }

            function getBotReply(q) {
              if(q.includes('hello') || q.includes('hi') || q.includes('hey')) {
                return "Hello! If you are a student, you can check results. If you are a teacher, use Staff Login.";
              }
              if(q.includes('student') || q.includes('result') || q.includes('marksheet')) {
                return "Students can enter their Roll Number, Date of Birth, check the CAPTCHA box, and click 'View Marksheet' to get their details.";
              }
              if(q.includes('teacher') || q.includes('staff') || q.includes('login') || q.includes('upload')) {
                return "Teachers can click the 'Staff Login' tab at the top, enter the security password, and access the results management dashboard.";
              }
              if(q.includes('password') || q.includes('change')) {
                return "To modify portal access credentials securely, please navigate to the standalone path: /admin-settings";
              }
              if(q.includes('pdf') || q.includes('download')) {
                return "Once a valid result is displayed, a button titled 'Download Provisional PDF' will appear underneath it.";
              }
              if(q.includes('captcha') || q.includes('robot')) {
                return "Make sure to check the 'I am not a robot' verification box before requesting data sheets.";
              }
              return "I am a helper bot. For deeper system actions, ensure you select the appropriate portal tabs at the top or contact college support!";
            }
          </script>
        `;

        // Injecting into the base page dynamically
        html = html.replace("</head>", themeAndChatStyles + "</head>");
        html = html.replace("</body>", chatbotHtml + chatbotLogicScript + "</body>");
      }
      originalSend.call(this, html);
    };
  }
  next();
});




module.exports = router;
