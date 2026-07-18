const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());

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

// DELETE ROUTE
app.delete("/api/delete-result/:roll", async (req, res) => {
  try {
    await Student.findOneAndDelete({ roll: req.params.roll });
    const log = new Log({ action: "Result Deleted for Roll: " + req.params.roll, performedBy: "Admin" });
    await log.save();
    res.status(200).json({ success: true, message: "Record Deleted Successfully" });
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
        .wide-card { max-width: 900px; }
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
        .view-records-container { margin-top: 20px; background: #0f172a; padding: 15px; border-radius: 8px; border: 1px solid #475569; overflow-x: auto; }
        .analytics-box { display: flex; gap: 10px; margin-bottom: 15px; justify-content: center; }
        .stat-card { background: #1e293b; padding: 8px 15px; border-radius: 6px; font-size: 0.85rem; border: 1px solid #334155; }
        .db-table { width: 100%; border-collapse: collapse; margin-top: 10px; min-width: 600px; }
        .db-table th, .db-table td { padding: 10px; text-align: left; border-bottom: 1px solid #334155; font-size: 0.8rem; }
        .db-table th { color: #38bdf8; background: #1e293b; }
        .action-btn { padding: 4px 8px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: bold; margin-right: 5px; }
      </style>
    </head>
        <body>
      <div class="header">
        <h1>🎓 Tech University</h1>
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
           
           <!-- Advanced View Records Container -->
           <div id="allRecordsContainer" class="view-records-container" style="display:none;">
             <h4 style="color:#38bdf8; margin-bottom:10px; font-size:0.9rem; text-align:center;">Database Records Log</h4>
             
             <!-- Analytics Box -->
             <div class="analytics-box">
               <div class="stat-card">Total: <b id="statTotal">0</b></div>
               <div class="stat-card" style="color:#4ade80;">Pass: <b id="statPass">0</b></div>
               <div class="stat-card" style="color:#f87171;">Fail: <b id="statFail">0</b></div>
             </div>

             <table class="db-table">
               <thead>
                 <tr>
                   <th>Student Details</th>
                   <th>Marks (JV | RP | OS | CO | UX)</th>
                   <th>Total (%)</th>
                   <th>Uploaded At</th>
                   <th>Actions</th>
                 </tr>
               </thead>
               <tbody id="recordsTableBody"></tbody>
             </table>
           </div>
        </div>

        <div class="form-group"><label>Student Name</label><input type="text" id="resName"></div>
        <div class="form-row">
          <div class="form-group"><label>Roll Number</label><input type="text" id="resRoll"></div>
          <div class="form-group"><label>Date of Birth</label><input type="date" id="resDob"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Java (0-100)</label><input type="number" id="subJava"></div>
          <div class="form-group"><label>R Prog (0-100)</label><input type="number" id="subR"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>OS (0-100)</label><input type="number" id="subOs"></div>
          <div class="form-group"><label>COA (0-100)</label><input type="number" id="subCoa"></div>
        </div>
        <div class="form-group"><label>Unix / Linux (0-100)</label><input type="number" id="subUnix"></div>

        <button class="btn btn-primary" onclick="publishResult()">Upload / Update Record</button>
        <div id="publishStatus" class="status-msg"></div>
        <button class="btn btn-secondary" onclick="logoutTeacher()">← Logout Securely</button>
      </div>

      <!-- PDF Hidden Layout Target Container -->
      <div id="pdf-container" style="display:none; padding: 30px; color: black; background: white; font-family: 'Segoe UI', sans-serif;"></div>

      <script>
        let currentRole = "";
        let cachedRecords = [];

        function switchTab(tab) {
  // 1. Saare cards ko pehle screen se hide karo
  document.querySelectorAll('.card').forEach(function(c) {
    c.classList.remove('visible');
  });
  
  // 2. Dono tabs se active blue border ya shadow styling hatao
  document.querySelectorAll('.nav-btn').forEach(function(b) {
    b.classList.remove('active');
  });
  
  // 3. Jo tab click hua hai, sirf use active karo aur uska card dikhao
  if (tab === 'student') {
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
            document.getElementById('teacherDashboardCard').classList.add('wide-card');
            checkPublishStatus();
            openDashboard();
          } 
          else if(pass === 'cse_teacher_2026') {
            currentRole = "Teacher";
            status.innerHTML = "<span class='success'>✓ Teacher Access Granted!</span>";
            document.getElementById('adminPanel').style.display = "none";
            document.getElementById('roleBadge').innerText = "Teacher";
            document.getElementById('teacherDashboardCard').classList.remove('wide-card');
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
          const tbody = document.getElementById('recordsTableBody');
          
          try {
            const res = await fetch('/api/all-results');
            const out = await res.json();
            
            if(out.success && out.data.length > 0) {
              cachedRecords = out.data;
              let passCount = 0, failCount = 0;

              tbody.innerHTML = out.data.map(d => {
                const total = d.subjects.java + d.subjects.rProg + d.subjects.os + d.subjects.coa + d.subjects.unixLinux;
                const pct = (total / 5).toFixed(1);
                const isPass = pct >= 40;
                if(isPass) passCount++; else failCount++;

                const dateObj = new Date(d.uploadedAt);
                const formattedTime = dateObj.toLocaleDateString('en-IN') + ' ' + dateObj.toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'});

                return '<tr>' +
                  '<td><b>' + d.name + '</b><br><small style="color:#94a3b8">Roll: ' + d.roll + '</small></td>' +
                  '<td>' + d.subjects.java + ' | ' + d.subjects.rProg + ' | ' + d.subjects.os + ' | ' + d.subjects.coa + ' | ' + d.subjects.unixLinux + '</td>' +
                  '<td style="color:' + (isPass ? '#4ade80' : '#f87171') + '"><b>' + total + '</b> (' + pct + '%)</td>' +
                  '<td><small>' + formattedTime + '</small></td>' +
                  '<td>' +
                    '<button class="action-btn" style="background:#38bdf8; color:#0f172a" onclick="populateEditForm(\'' + d.roll + '\')">✏️ Edit</button>' +
                    '<button class="action-btn" style="background:#ef4444; color:white" onclick="deleteRecord(\'' + d.roll + '\')">🗑️ Del</button>' +
                  '</td>' +
                '</tr>';
              }).join('');

              document.getElementById('statTotal').innerText = out.data.length;
              document.getElementById('statPass').innerText = passCount;
              document.getElementById('statFail').innerText = failCount;
              container.style.display = 'block';
            } else {
              tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:#94a3b8;'>No records found in database.</td></tr>";
              container.style.display = 'block';
            }
          } catch(err) {
            alert("Error fetching database records.");
          }
        }

        function populateEditForm(roll) {
          const student = cachedRecords.find(s => s.roll === roll);
          if(!student) return;

          document.getElementById('resName').value = student.name;
          document.getElementById('resRoll').value = student.roll;
          
          if(student.dob.includes('/')) {
            const parts = student.dob.split('/');
            document.getElementById('resDob').value = parts[2] + '-' + parts[1] + '-' + parts[0];
          }

          document.getElementById('subJava').value = student.subjects.java;
          document.getElementById('subR').value = student.subjects.rProg;
          document.getElementById('subOs').value = student.subjects.os;
          document.getElementById('subCoa').value = student.subjects.coa;
          document.getElementById('subUnix').value = student.subjects.unixLinux;
          
          window.scrollTo({ top: document.getElementById('resName').offsetTop - 20, behavior: 'smooth' });
          document.getElementById('publishStatus').innerHTML = "<span style='color:#38bdf8'> Loaded record for Edit! Modify fields and click update.</span>";
        }

        async function deleteRecord(roll) {
          if(!confirm("Are you sure you want to delete this result permanently?")) return;
          try {
            const res = await fetch('/api/delete-result/' + roll, { method: 'DELETE' });
            const out = await res.json();
            if(out.success) {
              alert("Record removed successfully!");
              viewAllRecords();
            }
          } catch(e) { alert("Failed to delete record."); }
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
              status.innerHTML = "<span class='success'>✓ Record Sync Complete!</span>";
              document.getElementById('resName').value = '';
              document.getElementById('resRoll').value = '';
              document.getElementById('resDob').value = '';
              document.getElementById('subJava').value = '';
              document.getElementById('subR').value = '';
              document.getElementById('subOs').value = '';
              document.getElementById('subCoa').value = '';
              document.getElementById('subUnix').value = '';
              
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
          
          container.innerHTML = content;
          container.style.display = 'block';

          const opt = {
            margin:       10,
            filename:     'Provisional_Marksheet.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    
