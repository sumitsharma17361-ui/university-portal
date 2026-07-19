const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());
const adminSettings = require("./admin-settings");
app.use("/", adminSettings);
const viewResults = require("./view-results");
app.use("/", viewResults);


// Hardcoded Secure MongoDB Connection
const MONGO_URI = "mongodb+srv://sumitsharma17361_db_user:S26CzHyqdBgLuFuw@cluster0.ihz6w8n.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log("Cloud Cluster Database Connected Successfully!"))
  .catch(err => console.error("Cloud DB Connection Error:", err));

// 1. Data Validation: Min 0, Max 100 applied
const studentSchema = new mongoose.Schema({
  roll: { type: String, required: true, unique: true },
  dob: { type: String, required: true },
  name: { type: String, required: true },
  course: { type: String, default: "B.Tech CSE" },
  subjects: {
    java: { type: Number, required: true, min: 0, max: 100 },
    rProg: { type: Number, required: true, min: 0, max: 100 },
    os: { type: Number, required: true, min: 0, max: 100 },
    coa: { type: Number, required: true, min: 0, max: 100 },
    unixLinux: { type: Number, required: true, min: 0, max: 100 }
  },
  uploadedAt: { type: Date, default: Date.now }
});

const Student = mongoose.model("Student", studentSchema);

// 2. Global Settings Schema (For Publish Toggle)
const configSchema = new mongoose.Schema({
  configId: { type: String, default: "global" },
  isPublished: { type: Boolean, default: false }
});
const Config = mongoose.model("Config", configSchema);

// 3. Audit Logs Schema
const logSchema = new mongoose.Schema({
  action: String,
  performedBy: String,
  timestamp: { type: Date, default: Date.now }
});
const Log = mongoose.model("Log", logSchema);

// API Routes
app.post("/api/add-result", async (req, res) => {
  try {
    const { roll, dob, name, subjects, role } = req.body;
    let student = await Student.findOne({ roll });
    if (student) {
      student.dob = dob; 
      student.name = name; 
      student.subjects = subjects; 
      student.uploadedAt = new Date();
      await student.save();
    } else {
      student = new Student({ roll, dob, name, subjects });
      await student.save();
    }
    
    // Save Audit Log
    const log = new Log({ action: "Result Updated for Roll: " + roll, performedBy: role });
    await log.save();

    res.status(200).json({ success: true, message: "Published successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/get-result", async (req, res) => {
  try {
    // Check if published
    let config = await Config.findOne({ configId: "global" });
    if (!config || !config.isPublished) {
      return res.status(403).json({ success: false, message: "Result is currently Hidden/Withheld by Administration." });
    }

    const { roll, dob } = req.body;
    const student = await Student.findOne({ roll, dob });
    if (student) {
      res.status(200).json({ success: true, data: student });
    } else {
      res.status(404).json({ success: false, message: "No record found!" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/all-results", async (req, res) => {
  try {
    const allStudents = await Student.find({}).sort({ uploadedAt: -1 });
    res.status(200).json({ success: true, data: allStudents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/toggle-publish", async (req, res) => {
  try {
    let config = await Config.findOne({ configId: "global" });
    if(!config) config = new Config({ configId: "global", isPublished: false });
    config.isPublished = !config.isPublished;
    await config.save();
    
    const log = new Log({ action: config.isPublished ? "Results Published" : "Results Hidden", performedBy: "Admin" });
    await log.save();

    res.status(200).json({ success: true, isPublished: config.isPublished });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/config-status", async (req, res) => {
  let config = await Config.findOne({ configId: "global" });
  if(!config) {
    config = new Config({ configId: "global", isPublished: false });
    await config.save();
  }
  res.status(200).json({ isPublished: config.isPublished });
});

// Frontend HTML
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tech University Portal</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
        body { background-color: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; min-height: 100vh; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #38bdf8; font-size: 2.2rem; }
        .header p { color: #94a3b8; font-size: 0.95rem; margin-top: 5px; }
        .main-nav { display: flex; gap: 20px; margin-bottom: 30px; width: 100%; max-width: 450px; }
        .nav-btn { flex: 1; background: #1e293b; border: 2px solid #334155; padding: 15px; border-radius: 12px; color: #f8fafc; cursor: pointer; font-size: 1rem; font-weight: 600; }
        .nav-btn.active { border-color: #38bdf8; background: #1e293b; box-shadow: 0 0 15px rgba(56, 189, 248, 0.2); }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 450px; padding: 25px; display: none; }
        .card.visible { display: block; }
        h2 { font-size: 1.4rem; color: #f1f5f9; margin-bottom: 20px; text-align: center; border-bottom: 1px solid #334155; padding-bottom: 10px; }
        .form-group { margin-bottom: 15px; }
        .form-row { display: flex; gap: 15px; margin-bottom: 15px; }
        .form-row .form-group { flex: 1; margin-bottom: 0; }
        label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 6px; }
        input { width: 100%; background: #0f172a; border: 1px solid #475569; border-radius: 8px; padding: 10px 14px; color: #f8fafc; }
        input:focus { outline: none; border-color: #38bdf8; }
        .btn { width: 100%; padding: 12px; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 10px; }
        .btn-primary { background: #ef4444; color: white; }
        .btn-secondary { background: #475569; color: white; }
        .btn-admin { background: #8b5cf6; color: white; }
        .status-msg { margin-top: 15px; text-align: center; font-size: 0.9rem; font-weight: 600; }
        .success { color: #4ade80; }
        .error { color: #f87171; }
        .fail-mark { color: #f87171; font-weight: bold; }
        .pass-mark { color: #4ade80; }
        .marksheet { background: #1e293b; border-radius: 12px; padding: 20px; margin-top: 20px; border: 1px dashed #475569; }
        .marksheet-header { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #475569; padding-bottom: 8px; }
        .marksheet-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.9rem; }
        .total-row { border-top: 1px solid #475569; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 1rem; color: #38bdf8; }
        .admin-controls { background: #0f172a; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px dashed #8b5cf6; display: none; }
        .captcha-box { border: 1px solid #475569; padding: 10px; text-align: center; border-radius: 8px; background: #0f172a; margin-top: 10px; color: #94a3b8; font-size: 0.85rem;}
        .view-records-container { margin-top: 20px; background: #0f172a; padding: 15px; border-radius: 8px; border: 1px solid #475569; }
        .record-item { border-bottom: 1px solid #334155; padding: 8px 0; display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; }
      </style>
    </head>
    <body>

      <div class="header">
        <h1>🎓 SITM COLLEGE</h1>
        <p>Unified Examination Management Portal</p>
      </div>

      <div class="main-nav" id="mainNav">
        <button class="nav-btn active" onclick="switchTab('student')">🧑‍🎓 Student</button>
        <button class="nav-btn" onclick="switchTab('teacher')">🛡️ Staff Login</button>
      </div>

      <!-- STUDENT PORTAL -->
      <div id="studentCard" class="card visible">
        <h2>Student Result Portal</h2>
        <div class="form-group"><label>Roll Number</label><input type="text" id="studentRoll"></div>
        <div class="form-group"><label>Date of Birth</label><input type="date" id="studentDob"></div>
        
        <div class="captcha-box">
           <input type="checkbox" id="mockCaptcha" style="width: auto;"> <span>I am not a robot (reCAPTCHA Verification)</span>
        </div>

        <button class="btn" style="background:#38bdf8; color:#0f172a;" onclick="fetchStudentResult()">View Marksheet</button>
        <div id="studentStatus" class="status-msg"></div>
        <div id="marksheetView" style="display:none;" class="marksheet"></div>
        <button id="downloadPdfBtn" class="btn btn-secondary" style="display:none;" onclick="downloadPDF()">⬇️ Download Provisional PDF</button>
      </div>

      <!-- AUTH PORTAL -->
      <div id="teacherAuthCard" class="card">
        <h2>Secure Staff Access</h2>
        <p style="text-align:center; color:#94a3b8; font-size:0.8rem; margin-bottom:15px;">Use Teacher or Admin Password</p>
        <div class="form-group"><label>Security Password</label><input type="password" id="teacherPassword"></div>
        <button class="btn" style="background:#4ade80; color:#0f172a;" onclick="verifyAuth()">Login to Cloud</button>
        <div id="authStatus" class="status-msg"></div>
      </div>

      <!-- STAFF DASHBOARD -->
      <div id="teacherDashboardCard" class="card">
        <h2>Records Dashboard (<span id="roleBadge"></span>)</h2>
        
        <!-- ADMIN CONTROLS -->
        <div id="adminPanel" class="admin-controls">
           <h3 style="color:#8b5cf6; font-size:1rem; margin-bottom:10px;">👑 Admin Controls</h3>
           <p style="font-size:0.85rem; color:#f8fafc; margin-bottom:10px;">Status: <b id="publishStatusTxt">Checking...</b></p>
           <button class="btn btn-admin" onclick="togglePublish()">Toggle Publish/Hide Status</button>
           <button class="btn btn-secondary" style="background:#8b5cf6; margin-top: 10px;" onclick="viewAllRecords()">📂 View All Saved Records</button>
           
           <!-- Hidden View Records Container -->
           <div id="allRecordsContainer" class="view-records-container" style="display:none;">
             <h4 style="color:#38bdf8; margin-bottom:10px; font-size:0.9rem; text-align:center;">Database Records</h4>
             <div id="recordsList"></div>
           </div>
        </div>

        <div class="form-group"><label>Student Name</label><input type="text" id="resName"></div>
        <div class="form-row">
          <div class="form-group"><label>Roll Number</label><input type="text" id="resRoll"></div>
          <div class="form-group"><label>Date of Birth</label><input type="date" id="resDob"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Java (0-100)</label><input type="number" id="subJava" min="0" max="100"></div>
          <div class="form-group"><label>R Prog (0-100)</label><input type="number" id="subR" min="0" max="100"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>OS (0-100)</label><input type="number" id="subOs" min="0" max="100"></div>
          <div class="form-group"><label>COA (0-100)</label><input type="number" id="subCoa" min="0" max="100"></div>
        </div>
        <div class="form-group"><label>Unix / Linux (0-100)</label><input type="number" id="subUnix" min="0" max="100"></div>

        <button class="btn btn-primary" onclick="publishResult()">Upload / Update Record</button>
        <div id="publishStatus" class="status-msg"></div>
        <button class="btn btn-secondary" onclick="logoutTeacher()">← Logout Securely</button>
      </div>

      <!-- PDF Hidden Layout Target Container -->
      <div id="pdf-container" style="display:none; padding: 40px; color: #000000; background: #ffffff; font-family: 'Segoe UI', sans-serif;"></div>

      <script>
        let currentRole = "";

        function switchTab(tab) {
          document.querySelectorAll('.card').forEach(c => c.classList.remove('visible'));
          document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
          
          if(tab === 'student') {
            document.querySelectorAll('.nav-btn')[0].classList.add('active');
            document.getElementById('studentCard').classList.add('visible');
          } else {
            document.querySelectorAll('.nav-btn')[1].classList.add('active');
            document.getElementById('teacherAuthCard').classList.add('visible');
          }
        }

        async function verifyAuth() {
          const pass = document.getElementById('teacherPassword').value;
          const status = document.getElementById('authStatus');
          
          if(pass === 'admin_secure_2026') {
            currentRole = "Admin";
            status.innerHTML = "<span class='success'>✓ Admin Access Granted!</span>";
            document.getElementById('adminPanel').style.display = "block";
            document.getElementById('roleBadge').innerText = "Admin";
            checkPublishStatus();
            openDashboard();
          } 
          else if(pass === 'cse_teacher_2026') {
            currentRole = "Teacher";
            status.innerHTML = "<span class='success'>✓ Teacher Access Granted!</span>";
            document.getElementById('adminPanel').style.display = "none";
            document.getElementById('roleBadge').innerText = "Teacher";
            openDashboard();
          } 
          else {
            status.innerHTML = "<span class='error'>❌ Invalid Security Password!</span>";
          }
        }

        function openDashboard() {
          setTimeout(() => {
            document.getElementById('teacherAuthCard').classList.remove('visible');
            document.getElementById('teacherDashboardCard').classList.add('visible');
            document.getElementById('mainNav').style.display = 'none';
          }, 800);
        }

        function logoutTeacher() {
          currentRole = "";
          document.getElementById('teacherPassword').value = ''; 
          document.getElementById('authStatus').innerHTML = '';
          document.getElementById('teacherDashboardCard').classList.remove('visible');
          document.getElementById('allRecordsContainer').style.display = 'none';
          document.getElementById('mainNav').style.display = 'flex';
          switchTab('student');
        }

        async function checkPublishStatus() {
          try {
            const res = await fetch('/api/config-status');
            const data = await res.json();
            document.getElementById('publishStatusTxt').innerText = data.isPublished ? "🟢 Results are LIVE" : "🔴 Results are HIDDEN";
          } catch(e) {}
        }

        async function togglePublish() {
          try {
            const res = await fetch('/api/toggle-publish', { method: 'POST' });
            const data = await res.json();
            if(data.success) {
              document.getElementById('publishStatusTxt').innerText = data.isPublished ? "🟢 Results are LIVE" : "🔴 Results are HIDDEN";
            }
          } catch(e) {}
        }

        async function viewAllRecords() {
          const container = document.getElementById('allRecordsContainer');
          const list = document.getElementById('recordsList');
          
          try {
            const res = await fetch('/api/all-results');
            const out = await res.json();
            
            if(out.success && out.data.length > 0) {
              list.innerHTML = out.data.map(d => {
                return '<div class="record-item" style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 12px 0; border-bottom: 1px solid #334155;">' +
                  '<div style="width: 100%; display: flex; justify-content: space-between; font-weight: bold; color: #f1f5f9;">' +
                    '<span>👤 ' + d.name + ' (Roll: ' + d.roll + ')</span>' +
                    '<span style="color: #4ade80; font-size: 0.8rem;">Saved</span>' +
                  '</div>' +
                  '<div style="font-size: 0.8rem; color: #94a3b8;">📅 DOB: ' + d.dob + ' | 🎓 Course: ' + (d.course || 'B.Tech CSE') + '</div>' +
                  '<div style="font-size: 0.8rem; color: #38bdf8; margin-top: 2px;">' +
                    '📚 Java: ' + (d.subjects ? d.subjects.java : 0) + ' | R: ' + (d.subjects ? d.subjects.rProg : 0) + ' | OS: ' + (d.subjects ? d.subjects.os : 0) + ' | COA: ' + (d.subjects ? d.subjects.coa : 0) + ' | Unix: ' + (d.subjects ? d.subjects.unixLinux : 0) +
                  '</div>' +
                '</div>';
              }).join('');
              container.style.display = 'block';
            } else {
              list.innerHTML = "<p style='text-align:center; font-size:0.85rem; color:#94a3b8;'>No records found in DB.</p>";
              container.style.display = 'block';
            }
          } catch(err) {
            alert("Error fetching system database records.");
          }
        }

        async function publishResult() {
          const status = document.getElementById('publishStatus');
          const data = {
            role: currentRole,
            name: document.getElementById('resName').value,
            roll: document.getElementById('resRoll').value,
            dob: document.getElementById('resDob').value.split('-').reverse().join('/'),
            subjects: {
              java: Number(document.getElementById('subJava').value),
              rProg: Number(document.getElementById('subR').value),
              os: Number(document.getElementById('subOs').value),
              coa: Number(document.getElementById('subCoa').value),
              unixLinux: Number(document.getElementById('subUnix').value)
            }
          };

          if(!data.name || !data.roll || !data.dob) {
            status.innerHTML = "<span class='error'>❌ Complete all inputs!</span>"; return;
          }

          status.innerHTML = "⏳ Validating and Syncing...";
          try {
            const res = await fetch('/api/add-result', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(data)
            });
            const out = await res.json();
            if(out.success) {
              status.innerHTML = "<span class='success'>✓ Record Updated & Logged!</span>";
              if(document.getElementById('allRecordsContainer').style.display === 'block') {
                viewAllRecords();
              }
            } else {
              status.innerHTML = "<span class='error'>❌ Error: " + out.error + "</span>";
            }
          } catch(err) {
            status.innerHTML = "<span class='error'>❌ Server Sync Failed!</span>";
          }
        }

        async function fetchStudentResult() {
          const roll = document.getElementById('studentRoll').value;
          let dob = document.getElementById('studentDob').value;
          const isCaptchaChecked = document.getElementById('mockCaptcha').checked;
          const status = document.getElementById('studentStatus');
          const msk = document.getElementById('marksheetView');
          const pdfBtn = document.getElementById('downloadPdfBtn');
          
          if(!roll || !dob) {
            status.innerHTML = "<span class='error'>❌ Enter Roll Number & DOB!</span>"; return;
          }
          if(!isCaptchaChecked) {
            status.innerHTML = "<span class='error'>❌ Please complete the CAPTCHA!</span>"; return;
          }
          
          dob = dob.split('-').reverse().join('/');
          status.innerHTML = '⏳ Verifying with Server...';
          msk.style.display = 'none';
          pdfBtn.style.display = 'none';

          try {
            const res = await fetch('/api/get-result', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ roll, dob })
            });
            const out = await res.json();
            
            if(out.success) {
              status.innerHTML = "<span class='success'>✓ Record Found!</span>";
              const d = out.data;
              const total = d.subjects.java + d.subjects.rProg + d.subjects.os + d.subjects.coa + d.subjects.unixLinux;
              const pct = ((total / 500) * 100).toFixed(2);
              
              msk.innerHTML = '<div class="marksheet-header">' +
                  '<span><b>NAME:</b> ' + d.name + '</span>' +
                  '<span><b>ROLL:</b> ' + d.roll + '</span>' +
                '</div>' +
                '<div style="font-size:0.8rem; color:#94a3b8; margin-bottom:10px;">COURSE: ' + d.course + '</div>' +
                '<div class="marksheet-row"><span>Java Programming:</span><b>' + d.subjects.java + '</b></div>' +
                '<div class="marksheet-row"><span>R Programming:</span><b>' + d.subjects.rProg + '</b></div>' +
                '<div class="marksheet-row"><span>Operating Systems:</span><b>' + d.subjects.os + '</b></div>' +
                '<div class="marksheet-row"><span>Computer Org & Arch:</span><b>' + d.subjects.coa + '</b></div>' +
                '<div class="marksheet-row"><span>Unix / Linux Lab:</span><b>' + d.subjects.unixLinux + '</b></div>' +
                '<div class="marksheet-row total-row">' +
                  '<span>Grand Total:</span>' +
                  '<span>' + total + '/500 (' + pct + '%)</span>' +
                '</div>';
              msk.style.display = 'block';
              pdfBtn.style.display = 'block';
            } else {
              status.innerHTML = "<span class='error'>❌ " + out.message + "</span>";
            }
          } catch(e) {
            status.innerHTML = "<span class='error'>❌ Server Error</span>";
          }
        }

        function downloadPDF() {
          const content = document.getElementById('marksheetView').innerHTML;
          const container = document.getElementById('pdf-container');
          
          container.innerHTML = '<div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 10px; margin-bottom: 20px;">' +
              '<h1 style="font-size: 24px; margin: 0; color: #000000;">SITM COLLEGE</h1>' +
              '<p style="font-size: 12px; margin: 5px 0 0 0; color: #555555;">Provisional Academic Performance Statement</p>' +
            '</div>' + content;
          
          container.style.display = 'block';

          const opt = {
            margin:       15,
            filename:     'Provisional_Marksheet.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          
          html2pdf().set(opt).from(container).save().then(() => {
            container.style.display = 'none';
          });
        }
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
