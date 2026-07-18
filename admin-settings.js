const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const https = require("https");

const Student = mongoose.models.Student || mongoose.model("Student", new mongoose.Schema({
  roll: String, dob: String, name: String, course: { type: String, default: "B.Tech CSE" },
  subjects: { java: Number, rProg: Number, os: Number, coa: Number, unixLinux: Number }
}));

const groqKey = "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"; 

router.get("/admin-settings", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html><head><title>Control Center</title>
    <style>body{background:#0f172a;color:#f8fafc;font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;}
    .card{background:#1e293b;padding:25px;border-radius:12px;width:100%;max-width:350px;}
    input,select{width:100%;background:#0f172a;border:1px solid #475569;padding:10px;color:#fff;margin:8px 0;border-radius:6px;}
    .btn{width:100%;padding:12px;background:#4ade80;color:#0f172a;border:none;font-weight:bold;border-radius:6px;cursor:pointer;}</style></head>
    <body><div class="card"><h2>🔑 Security Center</h2>
    <select id="role"><option value="Admin">Admin</option><option value="Teacher">Teacher</option></select>
    <input type="password" id="tok" placeholder="Master Pin"><input type="password" id="pass" placeholder="New Password">
    <button class="btn" onclick="upd()">Apply Change</button><div id="msg" style="margin-top:10px;text-align:center;"></div></div>
    <script>async function upd(){
      const r=document.getElementById('role').value,t=document.getElementById('tok').value,p=document.getElementById('pass').value,m=document.getElementById('msg');
      if(!t||!p){m.innerText="❌ Fill fields";return;}
      try{const res=await fetch('/api/update-portal-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:r,token:t,password:p})});
      const o=await res.json();m.innerText=o.success?"✓ Success!":"❌ Failed";}catch(e){m.innerText="❌ Error";}}</script></body></html>
  `);
});

router.post("/api/update-portal-password", async (req, res) => {
  try {
    if (req.body.token !== "sumit_master_2026") return res.status(401).json({ success: false });
    await mongoose.models.Credential.findOneAndUpdate({ role: req.body.role }, { password: req.body.password }, { upsert: true });
    res.status(200).json({ success: true });
  } catch (e) { res.status(500).json({ success: false }); }
});

router.use((req, res, next) => {
  if (req.path === "/") {
    const orig = res.send;
    res.send = function (html) {
      if (typeof html === "string") {
        const styles = `<style>
          #uniChatbotContainer{position:fixed;bottom:20px;right:20px;z-index:99999;font-family:sans-serif;}
          #uniChatLauncher{background:#0284c7;color:#fff;border:none;width:55px;height:55px;border-radius:50%;cursor:pointer;font-size:1.5rem;}
          #uniChatBox{width:320px;height:400px;background:#fff;border:1px solid #cbd5e1;border-radius:12px;display:none;flex-direction:column;overflow:hidden;}
          .chat-header{background:#0284c7;color:#fff;padding:12px;font-weight:bold;display:flex;justify-content:space-between;}
          .chat-logs{flex:1;padding:12px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;background:#f8fafc;font-size:0.85rem;}
          .chat-msg{padding:8px 12px;border-radius:10px;max-width:80%;line-height:1.4;white-space:pre-wrap;}
          .chat-msg.bot{background:#e2e8f0;color:#0f172a;align-self:flex-start;}
          .chat-msg.user{background:#e0f2fe;color:#0284c7;align-self:flex-end;}
          .chat-input-area{display:flex;padding:8px;border-top:1px solid #e2e8f0;background:#fff;}
          .chat-input-area input{flex:1;border:1px solid #cbd5e1;padding:6px;border-radius:6px;color:#000!important;background:#fff!important;}
          .chat-send-btn{background:#0284c7;color:#fff;border:none;padding:0 12px;margin-left:6px;border-radius:6px;cursor:pointer;}
        </style>`;
        const widget = `<div id="uniChatbotContainer"><button id="uniChatLauncher" onclick="tgl()">💬</button>
          <div id="uniChatBox"><div class="chat-header"><span>🏫 SITM AI Assistant</span><div>
          <button style="background:none;border:none;color:#fff;cursor:pointer;margin-right:8px;" onclick="clr()">🗑️</button>
          <button style="background:none;border:none;color:#fff;cursor:pointer;font-weight:bold;" onclick="tgl()">×</button></div></div>
          <div id="uniChatLogs" class="chat-logs"><div class="chat-msg bot">Hello! Give Roll No to fetch marks. Teachers can use custom format with security pins.</div></div>
          <div class="chat-input-area"><input type="text" id="uniInp" placeholder="Ask..." onkeypress="hnd(event)"><button class="chat-send-btn" onclick="snd()">Send</button></div></div></div>`;
        const script = `<script>
          let hist = JSON.parse(localStorage.getItem('sitm_chat_memory')) || [];
          window.addEventListener('DOMContentLoaded',()=>{
            const l=document.getElementById('uniChatLogs');
            if(hist.length>0){l.innerHTML='';hist.forEach(m=>{const div=document.createElement('div');div.className='chat-msg '+(m.role==='user'?'user':'bot');div.innerText=m.content;l.appendChild(div);});l.scrollTop=l.scrollHeight;}
          });
          function tgl(){const b=document.getElementById('uniChatBox'),l=document.getElementById('uniChatLauncher');if(b.style.display==='none'||!b.style.display){b.style.display='flex';l.style.display='none';}else{b.style.display='none';l.style.display='flex';}}
          function hnd(e){if(e.key==='Enter')snd();}
          function clr(){if(confirm("Delete history?")){localStorage.removeItem('sitm_chat_memory');hist=[];document.getElementById('uniChatLogs').innerHTML='<div class="chat-msg bot">Cleared!</div>';}}
          async function snd(){
            const i=document.getElementById('uniInp'),t=i.value.trim(),l=document.getElementById('uniChatLogs');if(!t)return;
            const u=document.createElement('div');u.className='chat-msg user';u.innerText=t;l.appendChild(u);i.value='';
            const load=document.createElement('div');load.className='chat-msg bot';load.innerText='⏳ Thinking...';l.appendChild(load);l.scrollTop=l.scrollHeight;
            try{const res=await fetch('/api/chat-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:t,history:hist})});
            const o=await res.json();load.remove();const b=document.createElement('div');b.className='chat-msg bot';b.innerText=o.reply;l.appendChild(b);
            hist.push({role:"user",content:t});hist.push({role:"assistant",content:o.reply});if(hist.length>16){hist.shift();hist.shift();}
            localStorage.setItem('sitm_chat_memory', JSON.stringify(hist));l.scrollTop=l.scrollHeight;}catch(e){load.innerText="Connection delay.";}
          }
        </script>`;
        html = html.replace("</head>", styles + "</head>").replace("</body>", widget + script + "</body>");
      }
      orig.call(this, html);
    };
  }
  next();
});

router.post("/api/chat-ai", async (req, res) => {
  try {
    const { question, history } = req.body;
    const lowerQ = question.toLowerCase();

    if (lowerQ.includes("roll") || lowerQ.includes("marks") || lowerQ.includes("result")) {
      const match = question.match(/\d+/);
      if (match) {
        const d = await Student.findOne({ roll: match[0] });
        if (d) {
          const total = d.subjects.java + d.subjects.rProg + d.subjects.os + d.subjects.coa + d.subjects.unixLinux;
          return res.status(200).json({ reply: `📊 *Result (Roll: ${d.roll})*\n👤 Name: ${d.name}\n🔹 Java: ${d.subjects.java}\n🔹 R Prog: ${d.subjects.rProg}\n🔹 OS: ${d.subjects.os}\n🔹 COA: ${d.subjects.coa}\n🔹 Unix: ${d.subjects.unixLinux}\n🏆 Total: ${total}/500 (${((total/500)*100).toFixed(2)}%)` });
        }
        return res.status(200).json({ reply: `❌ Roll Number ${match[0]} not found.` });
      }
    }

    if ((lowerQ.includes("add") || lowerQ.includes("update") || lowerQ.includes("upload")) && lowerQ.includes("pin")) {
      const pinM = question.match(/pin:\s*([^\s,]+)/i), rollM = question.match(/roll:\s*([^\s,]+)/i);
      const nameM = question.match(/name:\s*([^,]+)/i), dobM = question.match(/dob:\s*([^\s,]+)/i);
      const jM = question.match(/java:\s*(\d+)/i), rM = question.match(/rprog:\s*(\d+)/i);
      const oM = question.match(/os:\s*(\d+)/i), cM = question.match(/coa:\s*(\d+)/i), uM = question.match(/unix:\s*(\d+)/i);

      if (!pinM || !rollM || !nameM || !dobM) return res.status(200).json({ reply: "❌ Format check failed! Use:\nAdd result roll: 12, pin: cse_teacher_2026, name: Sumit, dob: 22/08/2005, java: 90, rprog: 85, os: 80, coa: 75, unix: 95" });
      if (pinM[1].trim() !== "cse_teacher_2026" && pinM[1].trim() !== "admin_secure_2026") return res.status(200).json({ reply: "❌ Invalid Security Pin!" });

      await Student.findOneAndUpdate({ roll: rollM[1].trim() }, {
        name: nameM[1].trim(), dob: dobM[1].trim(), uploadedAt: new Date(),
        subjects: { java: jM?Number(jM[1]):0, rProg: rM?Number(rM[1]):0, os: oM?Number(oM[1]):0, coa: cM?Number(cM[1]):0, unixLinux: uM?Number(uM[1]):0 }
      }, { upsert: true });
      return res.status(200).json({ reply: `✅ Success! Roll ${rollM[1].trim()} records injected.` });
    }

    let payload = [{ role: "system", content: "You are the SITM Campus AI Assistant. Current year is strictly 2026. Guide users concisely." }];
    if (history && Array.isArray(history)) history.forEach(m => { if(m.role&&m.content) payload.push({ role: m.role, content: m.content }); });
    payload.push({ role: "user", content: question });

    const postData = JSON.stringify({ model: "llama-3.3-70b-versatile", messages: payload });
    const apiReq = https.request({
      hostname: 'api.groq.com', path: '/openai/v1/chat/completions', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + groqKey, 'Content-Length': Buffer.byteLength(postData) }
    }, (apiRes) => {
      let body = ''; apiRes.on('data', (c) => body += c);
      apiRes.on('end', () => {
        try { res.status(200).json({ reply: JSON.parse(body).choices[0].message.content }); } 
        catch (e) { res.status(200).json({ reply: "JSON parse issue." }); }
      });
    });
    apiReq.write(postData); apiReq.end();
  } catch (error) { res.status(500).json({ reply: "Engine down." }); }
});

module.exports = router;
