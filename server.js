const express = require("express");
const mongoose = require("mongoose");
const app = express();
app.use(express.json());

const MONGO_URI = "mongodb+srv://sumitsharma17361_db_user:S26CzHyqdBgLuFuw@cluster0.ihz6w8n.mongodb.net/?appName=Cluster0";
mongoose.connect(MONGO_URI).then(() => console.log("DB Connected")).catch(err => console.error(err));

const studentSchema = new mongoose.Schema({
  roll: { type: String, required: true, unique: true },
  dob: { type: String, required: true },
  name: { type: String, required: true },
  course: { type: String, default: "B.Tech CSE" },
  subjects: { java: Number, rProg: Number, os: Number, coa: Number, unixLinux: Number },
  uploadedAt: { type: Date, default: Date.now }
});
const Student = mongoose.model("Student", studentSchema);
const Config = mongoose.model("Config", new mongoose.Schema({ configId: String, isPublished: Boolean }));
const Log = mongoose.model("Log", new mongoose.Schema({ action: String, performedBy: String, timestamp: { type: Date, default: Date.now } }));

app.post("/api/add-result", async (req, res) => {
  try {
    const { roll, dob, name, subjects, role } = req.body;
    await Student.findOneAndUpdate({ roll }, { dob, name, subjects, uploadedAt: new Date() }, { upsert: true });
    await new Log({ action: "Result Updated for Roll: " + roll, performedBy: role }).save();
    res.status(200).json({ success: true });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post("/api/get-result", async (req, res) => {
  try {
    let config = await Config.findOne({ configId: "global" });
    if (!config || !config.isPublished) return res.status(403).json({ success: false, message: "Result Hidden by Admin." });
    const student = await Student.findOne({ roll: req.body.roll, dob: req.body.dob });
    student ? res.status(200).json({ success: true, data: student }) : res.status(404).json({ success: false, message: "No record found!" });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get("/api/all-results", async (req, res) => {
  try { res.status(200).json({ success: true, data: await Student.find({}).sort({ uploadedAt: -1 }) }); } 
  catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.delete("/api/delete-result/:roll", async (req, res) => {
  try {
    await Student.findOneAndDelete({ roll: req.params.roll });
    await new Log({ action: "Deleted: " + req.params.roll, performedBy: "Admin" }).save();
    res.status(200).json({ success: true });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post("/api/toggle-publish", async (req, res) => {
  let config = await Config.findOne({ configId: "global" }) || new Config({ configId: "global", isPublished: false });
  config.isPublished = !config.isPublished;
  await config.save();
  res.status(200).json({ success: true, isPublished: config.isPublished });
});

app.get("/api/config-status", async (req, res) => {
  let config = await Config.findOne({ configId: "global" }) || await new Config({ configId: "global", isPublished: false }).save();
  res.status(200).json({ isPublished: config.isPublished });
});

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Tech University Portal</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
        body { background-color: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; min-height: 100vh; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; } .header h1 { color: #38bdf8; font-size: 2.2rem; }
        .main-nav { display: flex; gap: 20px; margin-bottom: 30px; width: 100%; max-width: 450px; }
        .nav-btn { flex: 1; background: #1e293b; border: 2px solid #334155; padding: 15px; border-radius: 12px; color: #f8fafc; cursor: pointer; font-weight: 600; }
        .nav-btn.active { border-color: #38bdf8; box-shadow: 0 0 15px rgba(56, 189, 248, 0.2); }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 450px; padding: 25px; display: none; }
        .card.visible { display: block; } .wide-card { max-width: 900px; }
        .form-group { margin-bottom: 15px; } .form-row { display: flex; gap: 15px; margin-bottom: 15px; } .form-row .form-group { flex: 1; }
        label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 6px; }
        input { width: 100%; background: #0f172a; border: 1px solid #475569; border-radius: 8px; padding: 10px 14px; color: #f8fafc; }
        .btn { width: 100%; padding: 12px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 10px; }
        .status-msg { margin-top: 15px; text-align: center; font-size: 0.9rem; font-weight: 600; }
        .marksheet { background: #1e293b; border-radius: 12px; padding: 20px; margin-top: 20px; border: 1px dashed #475569; }
        .marksheet-header { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #475569; padding-bottom: 8px; }
        .marksheet-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.9rem; }
        .total-row { border-top: 1px solid #475569; margin-top: 10px; padding-top: 10px; font-weight: bold; color: #38bdf8; }
        .admin-controls { background: #0f172a; padding: 15px; border-radius: 8px; border: 1px dashed #8b5cf6; display: none; }
        .captcha-box { border: 1px solid #475569; padding: 10px; text-align: center; border-radius: 8px; background: #0f172a; margin-top: 10px; color: #94a3b8; font-size: 0.85rem;}
        .view-records-container { margin-top: 20px; background: #0f172a; padding: 15px; border-radius: 8px; border: 1px solid #475569; overflow-x: auto; }
        .analytics-box { display: flex; gap: 10px; margin-bottom: 15px; justify-content: center; }
        .stat-card { background: #1e293b; padding: 8px 15px; border-radius: 6px; font-size: 0.85rem; border: 1px solid #334155; }
        .db-table { width: 100%; border-collapse: collapse; margin-top: 10px; min-width: 600px; }
        .db-table th, .db-table td { padding: 10px; text-align: left; border-bottom: 1px solid #334155; font-size: 0.8rem; }
        .action-btn { padding: 4px 8px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: bold; margin-right: 5px; }
      </style>
    </head>
    <body>
      <div class="header"><h1>🎓 Tech University</h1><p>Unified Examination Management Portal</p></div>
      <div class="main-nav" id="mainNav">
        <button class="nav-btn active" onclick="switchTab('student')">🧑‍🎓 Student</button>
        <button class="nav-btn" onclick="switchTab('teacher')">🛡️ Staff Login</button>
      </div>

      <div id="studentCard" class="card visible">
        <h2>Student Result Portal</h2>
        <div class="form-group"><label>Roll Number</label><input type="text" id="studentRoll"></div>
        <div class="form-group"><label>Date of Birth</label><input type="date" id="studentDob"></div>
        <div class="captcha-box"><input type="checkbox" id="mockCaptcha" style="width: auto;"> <span>I am not a robot</span></div>
        <button class="btn" style="background:#38bdf8; color:#0f172a;" onclick="fetchStudentResult()">View Marksheet</button>
        <div id="studentStatus" class="status-msg"></div>
        <div id="marksheetView" style="display:none;" class="marksheet"></div>
        <button id="downloadPdfBtn" class="btn" style="background:#475569; color:white; display:none;" onclick="downloadPDF()">⬇️ Download Provisional PDF</button>
      </div>

      <div id="teacherAuthCard" class="card">
        <h2>Secure Staff Access</h2>
        <div class="form-group"><label>Security Password</label><input type="password" id="teacherPassword"></div>
        <button class="btn" style="background:#4ade80; color:#0f172a;" onclick="verifyAuth()">Login to Cloud</button>
        <div id="authStatus" class="status-msg"></div>
      </div>

      <div id="teacherDashboardCard" class="card">
        <h2>Records Dashboard (<span id="roleBadge"></span>)</h2>
        <div id="adminPanel" class="admin-controls">
           <p style="font-size:0.85rem; margin-bottom:10px;">Status: <b id="publishStatusTxt">Checking...</b></p>
           <button class="btn" style="background:#8b5cf6; color:white;" onclick="togglePublish()">Toggle Publish/Hide Status</button>
           <button class="btn" style="background:#8b5cf6; color:white; margin-top: 10px;" onclick="viewAllRecords()">📂 View All Saved Records</button>
           <div id="allRecordsContainer" class="view-records-container" style="display:none;">
             <div class="analytics-box">
               <div class="stat-card">Total: <b id="statTotal">0</b></div>
               <div class="stat-card" style="color:#4ade80;">Pass: <b id="statPass">0</b></div>
               <div class="stat-card" style="color:#f87171;">Fail: <b id="statFail">0</b></div>
             </div>
             <table class="db-table">
               <thead><tr><th>Student Details</th><th>Marks (JV|RP|OS|CO|UX)</th><th>Total (%)</th><th>Uploaded At</th><th>Actions</th></tr></thead>
               <tbody id="recordsTableBody"></tbody>
             </table>
           </div>
        </div>

        <div class="form-group" style="margin-top:15px;"><label>Student Name</label><input type="text" id="resName"></div>
        <div class="form-row">
          <div class="form-group"><label>Roll Number</label><input type="text" id="resRoll"></div>
          <div class="form-group"><label>Date of Birth</label><input type="date" id="resDob"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Java</label><input type="number" id="subJava"></div>
          <div class="form-group"><label>R Prog</label><input type="number" id="subR"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>OS</label><input type="number" id="subOs"></div>
          <div class="form-group"><label>COA</label><input type="number" id="subCoa"></div>
        </div>
        <div class="form-group"><label>Unix / Linux</label><input type="number" id="subUnix"></div>
        <button class="btn" style="background:#ef4444; color:white;" onclick="publishResult()">Upload / Update Record</button>
        <div id="publishStatus" class="status-msg"></div>
        <button class="btn" style="background:#475569; color:white;" onclick="logoutTeacher()">← Logout Securely</button>
      </div>

      <div id="pdf-container" style="display:none; padding: 30px; color: black; background: white;"></div>

      <script>
        let currentRole = "", cachedRecords = [];
        function switchTab(tab) {
          document.querySelectorAll('.card').forEach(c => c.classList.remove('visible'));
          if(tab === 'student') { document.getElementById('studentCard').classList.add('visible'); } 
          else { document.getElementById('teacherAuthCard').classList.add('visible'); }
        }

        async function verifyAuth() {
          const pass = document.getElementById('teacherPassword').value;
          if(pass === 'admin_secure_2026') {
            currentRole = "Admin"; document.getElementById('adminPanel').style.display = "block";
            document.getElementById('roleBadge').innerText = "Admin";
            document.getElementById('teacherDashboardCard').classList.add('wide-card');
            checkPublishStatus(); openDashboard();
          } else if(pass === 'cse_teacher_2026') {
            currentRole = "Teacher"; document.getElementById('adminPanel').style.display = "none";
            document.getElementById('roleBadge').innerText = "Teacher";
            document.getElementById('teacherDashboardCard').classList.remove('wide-card');
            openDashboard();
          } else { alert("Invalid Security Password!"); }
        }

        function openDashboard() {
          document.getElementById('teacherAuthCard').classList.remove('visible');
          document.getElementById('teacherDashboardCard').classList.add('visible');
          document.getElementById('mainNav').style.display = 'none';
        }

        function logoutTeacher() {
          currentRole = ""; document.getElementById('teacherPassword').value = '';
          document.getElementById('teacherDashboardCard').classList.remove('visible');
          document.getElementById('allRecordsContainer').style.display = 'none';
          document.getElementById('mainNav').style.display = 'flex'; switchTab('student');
        }

        async function checkPublishStatus() {
          const res = await fetch('/api/config-status'); const data = await res.json();
          document.getElementById('publishStatusTxt').innerText = data.isPublished ? "🟢 LIVE" : "🔴 HIDDEN";
        }

        async function togglePublish() {
          const res = await fetch('/api/toggle-publish', { method: 'POST' }); const data = await res.json();
          if(data.success) document.getElementById('publishStatusTxt').innerText = data.isPublished ? "🟢 LIVE" : "🔴 HIDDEN";
        }

        async function viewAllRecords() {
          const res = await fetch('/api/all-results'); const out = await res.json();
          if(out.success && out.data.length > 0) {
            cachedRecords = out.data; let pC = 0, fC = 0;
            document.getElementById('recordsTableBody').innerHTML = out.data.map(d => {
              const t = d.subjects.java + d.subjects.rProg + d.subjects.os + d.subjects.coa + d.subjects.unixLinux;
              const pct = (t / 5).toFixed(1); const passed = pct >= 40; passed ? pC++ : fC++;
              const dt = new Date(d.uploadedAt).toLocaleString('en-IN');
              return '<tr><td><b>'+d.name+'</b><br>Roll: '+d.roll+'</td><td>'+d.subjects.java+'|'+d.subjects.rProg+'|'+d.subjects.os+'|'+d.subjects.coa+'|'+d.subjects.unixLinux+'</td><td style="color:'+(passed?'#4ade80':'#f87171')+'"><b>'+t+'</b> ('+pct+'%)</td><td><small>'+dt+'</small></td><td><button class="action-btn" style="background:#38bdf8;" onclick="populateEditForm(\''+d.roll+'\')">Edit</button><button class="action-btn" style="background:#ef4444; color:white;" onclick="deleteRecord(\''+d.roll+'\')">Del</button></td></tr>';
            }).join('');
            document.getElementById('statTotal').innerText = out.data.length;
            document.getElementById('statPass').innerText = pC; document.getElementById('statFail').innerText = fC;
            document.getElementById('allRecordsContainer').style.display = 'block';
          }
        }

        function populateEditForm(roll) {
          const s = cachedRecords.find(x => x.roll === roll); if(!s) return;
          document.getElementById('resName').value = s.name; document.getElementById('resRoll').value = s.roll;
          if(s.dob.includes('/')) { const p = s.dob.split('/'); document.getElementById('resDob').value = p[2]+'-'+p[1]+'-'+p[0]; }
          document.getElementById('subJava').value = s.subjects.java; document.getElementById('subR').value = s.subjects.rProg;
          document.getElementById('subOs').value = s.subjects.os; document.getElementById('subCoa').value = s.subjects.coa;
          document.getElementById('subUnix').value = s.subjects.unixLinux;
        }

        async function deleteRecord(roll) {
          if(!confirm("Delete permanently?")) return;
          const res = await fetch('/api/delete-result/' + roll, { method: 'DELETE' }); const out = await res.json();
          if(out.success) { alert("Deleted!"); viewAllRecords(); }
        }

        async function publishResult() {
          const data = {
            role: currentRole, name: document.getElementById('resName').value, roll: document.getElementById('resRoll').value,
            dob: document.getElementById('resDob').value.split('-').reverse().join('/'),
            subjects: {
              java: Number(document.getElementById('subJava').value), rProg: Number(document.getElementById('subR').value),
              os: Number(document.getElementById('subOs').value), coa: Number(document.getElementById('subCoa').value), unixLinux: Number(document.getElementById('subUnix').value)
            }
          };
          const res = await fetch('/api/add-result', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
          const out = await res.json();
          if(out.success) { alert("Synced!"); viewAllRecords(); }
        }

        async function fetchStudentResult() {
          const roll = document.getElementById('studentRoll').value;
          let dob = document.getElementById('studentDob').value;
          if(!document.getElementById('mockCaptcha').checked) { alert("Check CAPTCHA!"); return; }
          dob = dob.split('-').reverse().join('/');
          const res = await fetch('/api/get-result', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ roll, dob }) });
          const out = await res.json();
          if(out.success) {
            const d = out.data; const t = d.subjects.java + d.subjects.rProg + d.subjects.os + d.subjects.coa + d.subjects.unixLinux;
            document.getElementById('marksheetView').innerHTML = '<div class="marksheet-header"><span><b>NAME:</b> '+d.name+'</span><span><b>ROLL:</b> '+d.roll+'</span></div><div class="marksheet-row"><span>Java:</span><b>'+d.subjects.java+'</b></div><div class="marksheet-row"><span>R Prog:</span><b>'+d.subjects.rProg+'</b></div><div class="marksheet-row"><span>OS:</span><b>'+d.subjects.os+'</b></div><div class="marksheet-row"><span>COA:</span><b>'+d.subjects.coa+'</b></div><div class="marksheet-row"><span>Unix:</span><b>'+d.subjects.unixLinux+'</b></div><div class="marksheet-row total-row"><span>Total:</span><span>'+t+'/500</span></div>';
            document.getElementById('marksheetView').style.display = 'block'; document.getElementById('downloadPdfBtn').style.display = 'block';
          } else { alert(out.message); }
        }

        function downloadPDF() {
          const container = document.getElementById('pdf-container');
          container.innerHTML = document.getElementById('marksheetView').innerHTML;
          container.style.display = 'block';
          html2pdf().from(container).save().then(() => container.style.display = 'none');
        }
      </script>
    </body>
    </html>`);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
