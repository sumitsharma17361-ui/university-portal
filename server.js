const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

const adminSettings = require("./admin-settings");
app.use("/", adminSettings);
const downloadPdfRouter = require("./download-pdf");
app.use("/", downloadPdfRouter);

const MONGO_URI = "mongodb+srv://sumitsharma17361_db_user:S26CzHyqdBgLuFuw@cluster0.ihz6w8n.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log("Cloud Cluster Database Connected Successfully!"))
  .catch(err => console.error("Cloud DB Connection Error:", err));

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

const configSchema = new mongoose.Schema({
  configId: { type: String, default: "global" },
  isPublished: { type: Boolean, default: false }
});
const Config = mongoose.model("Config", configSchema);

const logSchema = new mongoose.Schema({
  action: String,
  performedBy: String,
  timestamp: { type: Date, default: Date.now }
});
const Log = mongoose.model("Log", logSchema);

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
    
    const log = new Log({ action: "Result Updated for Roll: " + roll, performedBy: role });
    await log.save();
    res.status(200).json({ success: true, message: "Published successfully!" });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post("/api/get-result", async (req, res) => {
  try {
    let config = await Config.findOne({ configId: "global" });
    if (!config || !config.isPublished) {
      return res.status(403).json({ success: false, message: "Result is currently Hidden/Withheld by Administration." });
    }
    const { roll, dob } = req.body;
    const student = await Student.findOne({ roll, dob });
    if (student) { res.status(200).json({ success: true, data: student }); } 
    else { res.status(404).json({ success: false, message: "No record found!" }); }
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get("/api/all-results", async (req, res) => {
  try {
    const allStudents = await Student.find({}).sort({ uploadedAt: -1 });
    res.status(200).json({ success: true, data: allStudents });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post("/api/toggle-publish", async (req, res) => {
  try {
    let config = await Config.findOne({ configId: "global" });
    if(!config) config = new Config({ configId: "global", isPublished: false });
    config.isPublished = !config.isPublished;
    await config.save();
    res.status(200).json({ success: true, isPublished: config.isPublished });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get("/api/config-status", async (req, res) => {
  let config = await Config.findOne({ configId: "global" });
  if(!config) { config = new Config({ configId: "global", isPublished: false }); await config.save(); }
  res.status(200).json({ isPublished: config.isPublished });
});

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
        .status-msg { margin-top: 15px; text-align: center; font-size: 0.9rem; font-weight: 600; }
        .success { color: #4ade80; } .error { color: #f87171; }
        .marksheet { background: #1e293b; border-radius: 12px; padding: 20px; margin-top: 20px; border: 1px dashed #475569; }
        .marksheet-header { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #475569; padding-bottom: 8px; }
        .marksheet-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.9rem; }
        .total-row { border-top: 1px solid #475569; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 1rem; color: #38bdf8; }
        .admin-controls { background: #0f172a; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px dashed #8b5cf6; display: none; }
        .captcha-box { border: 1px solid #475569; padding: 10px; text-align: center; border-radius: 8px; background: #0f172a; margin-top: 10px; color: #94a3b8; font-size: 0.85rem;}
        
        /* 📊 CSS FOR DEEP FULL VIEW MASTER TABLE */
        .view-records-container { margin-top: 20px; background: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #475569; max-height: 400px; overflow-y: auto; overflow-x: auto; }
        .master-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; color: #f1f5f9; text-align: left; min-width: 500px; }
        .master-table th { background: #1e293b; color: #38bdf8; padding: 8px; border: 1px solid #334155; font-weight: 600; position: sticky; top: 0; }
        .master-table td { padding: 8px; border: 1px solid #334155; }
        .master-table tr:nth-child(even) { background: #131e31; }
      </style>
    </head>
    <body>

      <div class="header">
        <h1>🎓 SITM COLLEGE</h1>
        <p>Unified Examination Management Portal</p>
      </div>

      <div class="main-nav" id="mainNav">
        <button class="nav-btn active" id="btnTabStudent" onclick="switchTab('student')">🧑‍🎓 Student</button>
        <button class="nav-btn" id="btnTabTeacher" onclick="switchTab('teacher')">🛡️ Staff Login</button>
      </div>

      <!-- STUDENT PORTAL -->
      <div id="studentCard" class="card visible">
        <h2>Student Result Portal</h2>
        <div class="form-group"><label>Roll Number</label><input type="text" id="studentRoll"></div>
        <div class="form-group"><label>Date of Birth</label><input type="date" id="studentDob"></div>
        <div class="captcha-box"><input type="checkbox" id="mockCaptcha" style="width: auto;"> <span>I am not a robot (reCAPTCHA Verification)</span></div>
        <button class="btn" style="background:#38bdf8; color:#0f172a;" onclick="fetchStudentResult()">View Marksheet</button>
        <div id="studentStatus" class="status-msg"></div>
        <div id="marksheetView" style="display:none;" class="marksheet"></div>
        <button id="downloadPdfBtn" class="btn btn-secondary" style="display:none;" onclick="downloadPDF()">⬇️ Download Provisional PDF</button>
      </div>

      <!-- AUTH PORTAL -->
      <div id="teacherAuthCard" class="card">
        <h2>Secure Staff Access</h2>
        <div class="form-group"><label>Security Password</label><input type="password" id="teacherPassword"></div>
        <button class="btn" style="background:#4ade80; color:#0f172a;" onclick="verifyAuth()">Login to Cloud</button>
        <div id="authStatus" class="status-msg"></div>
      </div>

      <!-- STAFF DASHBOARD -->
      <div id="teacherDashboardCard" class="card" style="max-width: 600px;">
        <h2>Records Dashboard (<span id="roleBadge"></span>)</h2>
        <div id="adminPanel" class="admin-controls">
           <p style="font-size:0.85rem; margin-bottom:10px;">Status: <b id="publishStatusTxt">Checking...</b></p>
           <button class="btn btn-primary" style="background:#8b5cf6;" onclick="togglePublish()">Toggle Publish/Hide Status</button>
           <button class="btn btn-secondary" style="margin-top: 10px;" onclick="viewAllRecords()">📂 View All Saved Records (Deep View)</button>
           <div id="allRecordsContainer" class="view-records-container" style="display:none;"><div id="recordsList"></div></div>
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

      <div id="pdf-container" style="display:none; padding: 40px; color: #000000; background: #ffffff;"></div>

      <script>
        let currentRole = "";

        function switchTab(tab) {
          document.getElementById('studentCard').classList.remove('visible');
          document.getElementById('teacherAuthCard').classList.remove('visible');
          document.getElementById('teacherDashboardCard').classList.remove('visible');
          document.getElementById('btnTabStudent').classList.remove('active');
          document.getElementById('btnTabTeacher').classList.remove('active');
          
          if(tab === 'student') {
            document.getElementById('btnTabStudent').classList.add('active');
            document.getElementById('studentCard').classList.add('visible');
          } else {
            document.getElementById('btnTabTeacher').classList.add('active');
            document.getElementById('teacherAuthCard').classList.add('visible');
          }
        }

        async function verifyAuth() {
          const pass = document.getElementById('teacherPassword').value;
          const status = document.getElementById('authStatus');
          if(pass === 'admin_secure_2026') {
            currentRole = "Admin"; status.innerHTML = "<span class='success'>✓ Admin Access Granted!</span>";
            document.getElementById('adminPanel').style.display = "block";
            document.getElementById('roleBadge').innerText = "Admin";
            checkPublishStatus(); openDashboard();
          } else if(pass === 'cse_teacher_2026') {
            currentRole = "Teacher"; status.innerHTML = "<span class='success'>✓ Teacher Access Granted!</span>";
            document.getElementById('adminPanel').style.display = "block"; // Allow deep view table to teacher too
            document.getElementById('roleBadge').innerText = "Teacher"; openDashboard();
          } else { status.innerHTML = "<span class='error'>❌ Invalid Security Password!</span>"; }
        }

        function openDashboard() {
          setTimeout(function() {
            document.getElementById('teacherAuthCard').classList.remove('visible');
            document.getElementById('teacherDashboardCard').classList.add('visible');
            document.getElementById('mainNav').style.display = 'none';
          }, 400);
        }

        function logoutTeacher() {
          currentRole = ""; document.getElementById('teacherPassword').value = ''; 
          document.getElementById('teacherDashboardCard').classList.remove('visible');
          document.getElementById('mainNav').style.display = 'flex'; switchTab('student');
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
            document.getElementById('publishStatusTxt').innerText = data.isPublished ? "🟢 Results are LIVE" : "🔴 Results are HIDDEN";
          } catch(e) {}
        }

        // 📊 UPGRADED MASTER DEEP TABLE DATA POPULATION METHOD
        async function viewAllRecords() {
          const container = document.getElementById('allRecordsContainer');
          const list = document.getElementById('recordsList');
          try {
            const res = await fetch('/api/all-results');
            const out = await res.json();
            if(out.success && out.data.length > 0) {
              let tableHtml = '<table class="master-table">' +
                '<tr>' +
                  '<th>Name</th>' +
                  '<th>Roll</th>' +
                  '<th>DOB</th>' +
                  '<th>Java</th>' +
                  '<th>R</th>' +
                  '<th>OS</th>' +
                  '<th>COA</th>' +
                  '<th>Unix</th>' +
                  '<th>Total</th>' +
                '</tr>';
                
              out.data.forEach(function(d) {
                const t = d.subjects.java + d.subjects.rProg + d.subjects.os + d.subjects.coa + d.subjects.unixLinux;
                tableHtml += '<tr>' +
                  '<td><b>' + d.name + '</b></td>' +
                  '<td>' + d.roll + '</td>' +
                  '<td>' + d.dob + '</td>' +
                  '<td>' + d.subjects.java + '</td>' +
                  '<td>' + d.subjects.rProg + '</td>' +
                  '<td>' + d.subjects.os + '</td>' +
                  '<td>' + d.subjects.coa + '</td>' +
                  '<td>' + d.subjects.unixLinux + '</td>' +
                  '<td><b>' + t + '</b></td>' +
                '</tr>';
              });
              
              tableHtml += '</table>';
              list.innerHTML = tableHtml;
              container.style.display = 'block';
            } else {
              list.innerHTML = '<div style="font-size:0.85rem; color:#94a3b8; text-align:center;">No records available.</div>';
              container.style.display = 'block';
            }
          } catch(err) { alert("Error fetching full dynamic master list."); }
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

          if(!data.name || !data.roll || !data.dob) { alert("Complete all inputs!"); return; }
          try {
            const res = await fetch('/api/add-result', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(data)
            });
            const out = await res.json();
            if(out.success) { 
              status.innerHTML = "<span class='success'>✓ Record Updated & Logged!</span>";
              if(document.getElementById('allRecordsContainer').style.display === 'block') { viewAllRecords(); }
            }
          } catch(err) { status.innerHTML = "<span class='error'>❌ Server Sync Failed!</span>"; }
        }

        async function fetchStudentResult() {
          const roll = document.getElementById('studentRoll').value;
          let dob = document.getElementById('studentDob').value;
          if(!roll || !dob || !document.getElementById('mockCaptcha').checked) {
            alert("Enter Entries & Check Captcha!"); return;
          }
          dob = dob.split('-').reverse().join('/');
          document.getElementById('studentStatus').innerHTML = '⏳ Verifying...';
          
          try {
            const res = await fetch('/api/get-result', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ roll, dob })
            });
            const out = await res.json();
            if(out.success) {
              document.getElementById('studentStatus').innerHTML = "<span class='success'>✓ Found!</span>";
              const d = out.data;
              const total = d.subjects.java + d.subjects.rProg + d.subjects.os + d.subjects.coa + d.subjects.unixLinux;
              const pct = ((total / 500) * 100).toFixed(2);
              
              document.getElementById('marksheetView').innerHTML = '<div class="marksheet-header"><span><b>NAME:</b> ' + d.name + '</span><span><b>ROLL:</b> ' + d.roll + '</span></div>' +
                '<div style="font-size:0.8rem; color:#94a3b8; margin-bottom:10px;">COURSE: ' + d.course + '</div>' +
                '<div class="marksheet-row"><span>Java Programming:</span><b>' + d.subjects.java + '</b></div>' +
                '<div class="marksheet-row"><span>R Programming:</span><b>' + d.subjects.rProg + '</b></div>' +
                '<div class="marksheet-row"><span>Operating Systems:</span><b>' + d.subjects.os + '</b></div>' +
                '<div class="marksheet-row"><span>Computer Org & Arch:</span><b>' + d.subjects.coa + '</b></div>' +
                '<div class="marksheet-row"><span>Unix / Linux Lab:</span><b>' + d.subjects.unixLinux + '</b></div>' +
                '<div class="marksheet-row total-row"><span>Grand Total:</span><span>' + total + '/500 (' + pct + '%)</span></div>';
              
              document.getElementById('marksheetView').style.display = 'block';
              document.getElementById('downloadPdfBtn').style.display = 'block';
            } else { document.getElementById('studentStatus').innerHTML = "<span class='error'>❌ " + out.message + "</span>"; }
          } catch(e) { document.getElementById('studentStatus').innerHTML = "<span class='error'>❌ Server Error</span>"; }
        }

        async function downloadPDF() {
          const roll = document.getElementById('studentRoll').value;
          let dob = document.getElementById('studentDob').value;
          dob = dob.split('-').reverse().join('/');
          try {
            const resData = await fetch('/api/get-result', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ roll, dob })
            });
            const out = await resData.json();
            if (out.success) {
              const d = out.data;
              const total = d.subjects.java + d.subjects.rProg + d.subjects.os + d.subjects.coa + d.subjects.unixLinux;
              const pct = ((total / 500) * 100).toFixed(2);
              const pdfRes = await fetch('/api/download-provisional-pdf', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ name: d.name, roll: d.roll, dob: d.dob, course: d.course, subjects: d.subjects, total, pct })
              });
              const pdfOut = await pdfRes.json();
              if(pdfOut.success) {
                const container = document.getElementById('pdf-container');
                container.innerHTML = pdfOut.htmlContent; container.style.display = 'block';
                const opt = { margin: 15, filename: 'Provisional_Marksheet_' + roll + '.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }};
                setTimeout(function() { html2pdf().set(opt).from(container).save().then(function() { container.style.display = 'none'; }); }, 500);
              }
            }
          } catch(err) { alert("PDF compiling module transmission error."); }
        }
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
