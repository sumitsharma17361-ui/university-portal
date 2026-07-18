const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { GoogleGenAI } = require("@google/generative-ai"); // <-- Sabse upar ye jud gaya

// Database Schema for Credentials
const credentialSchema = new mongoose.Schema({
  role: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const Credential = mongoose.models.Credential || mongoose.model("Credential", credentialSchema);

// 🔑 APNI GEMINI API KEY YAHAN DAALO
const aiKey = "YOUR_GEMINI_API_KEY_HERE"; // <-- Yahan aapki key rahegi
let aiInstance = null;
if (aiKey !== "AQ.Ab8RN6IxTKrK1z75wmVnZ0jwuGubyfypSbVP68u50zhwAd5utA") {
  const genAI = new GoogleGenAI({ apiKey: aiKey });
  aiInstance = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

// 1️⃣ KAHAN UPDATE KARNA HAI: router.get("/admin-settings") wala purana block waisa hi rahega
router.get("/admin-settings", (req, res) => {
  res.send(`... (Purana HTML settings page waisa hi chalne do) ...`);
});

// 2️⃣ KAHAN UPDATE KARNA HAI: router.post("/api/update-portal-password") purana waisa hi rahega
router.post("/api/update-portal-password", async (req, res) => {
  // ... password change karne ka login code waisa hi rahega
});


// 3️⃣ IS JAGAH NAYA INJECTOR ENGINE UPDATE KARNA HAI (Purane theme injector ko hata kar):
router.use((req, res, next) => {
  if (req.path === "/") {
    const originalSend = res.send;
    res.send = function (html) {
      if (typeof html === "string") {
        const themeAndChatStyles = `
          <style>
            /* White & Blue Theme */
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

            /* Chatbot Floating Layout */
            #uniChatbotContainer { position: fixed; bottom: 20px; right: 20px; z-index: 99999; font-family: 'Segoe UI', sans-serif; }
            #uniChatLauncher { background: #0284c7; color: white; border: none; width: 60px; height: 60px; border-radius: 50%; cursor: pointer; font-size: 1.6rem; box-shadow: 0 4px 12px rgba(2,132,199,0.4); display: flex; align-items: center; justify-content: center; }
            #uniChatBox { width: 340px; height: 430px; background: white; border: 1px solid #cbd5e1; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); display: none; flex-direction: column; overflow: hidden; }
            .chat-header { background: #0284c7; color: white; padding: 15px; font-weight: 600; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; }
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
                <span>🏫 Portal Smart AI Assistant</span>
                <button onclick="toggleUniChat()" style="background:none; border:none; color:white; cursor:pointer; font-weight:bold; font-size:1.1rem;">×</button>
              </div>
              <div id="uniChatLogs" class="chat-logs">
                <div class="chat-msg bot">Hello! I am now powered by Google Gemini. 🚀 Ask me anything about the portal or your computer science studies!</div>
              </div>
              <div class="chat-input-area">
                <input type="text" id="uniChatInput" placeholder="Ask Google Gemini..." onkeypress="handleChatKey(event)">
                <button class="chat-send-btn" onclick="sendUniChatMessage()">Send</button>
              </div>
            </div>
          </div>
        `;

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

            async function sendUniChatMessage() {
              const input = document.getElementById('uniChatInput');
              const text = input.value.trim();
              if(!text) return;

              appendMsg(text, 'user');
              input.value = '';

              appendMsg("⏳ Typing...", 'bot-loading');

              try {
                const res = await fetch('/api/chat-ai', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ question: text })
                });
                const out = await res.json();
                
                removeLoadingMsg();
                appendMsg(out.reply, 'bot');
              } catch(err) {
                removeLoadingMsg();
                appendMsg("Sorry, I am facing a connection issue right now.", 'bot');
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

// 4️⃣ YEH NAYA ENDPOINT BILKUL NICHE SUBSE END MEIN JODNA HAI:
router.post("/api/chat-ai", async (req, res) => {
  try {
    const { question } = req.body;
    if (!aiInstance) {
      return res.json({ reply: "AI Key is not configured yet." });
    }

    const promptContext = "You are a helpful assistant for a Tech University portal website. Answer the user nicely. Question: " + question;
    const result = await aiInstance.generateContent(promptContext);
    const response = await result.response;
    
    res.status(200).json({ reply: response.text() });
  } catch (error) {
    res.status(500).json({ reply: "Error connecting to Gemini Cloud: " + error.message });
  }
});

module.exports = router;
