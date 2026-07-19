const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());
const adminSettings = require("./admin-settings");
app.use("/", adminSettings);
const downloadPdfRouter = require("./download-pdf");
app.use("/", downloadPdfRouter);

const MONGO_URI = "mongodb+srv://sumitsharma17361_db_user:S26CzHyqdBgLuFuw@cluster0.ihz6w8n.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log("Cloud Cluster Database Connected Successfully!"))
  .catch(err => console.error("Cloud DB Connection Error:", err));

// Complete Admission Validation Schema Setup
const studentSchema = new mongoose.Schema({
  roll: { type: String, required: true, unique: true },
  dob: { type: String, required: true },
  name: { type: String, required: true },
  gender: { type: String, default: "Male" },
  fatherName: { type: String, default: "" },
  motherName: { type: String, default: "" },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  aadhaar: { type: String, default: "" },
  address: { type: String, default: "" },
  marks10: { type: Number, default: 0 },
  marks12: { type: Number, default: 0 },
  course: { type: String, default: "B.Tech CSE" },
  subjects: {
    java: { type: Number, default: 0 },
    rProg: { type: Number, default: 0 },
    os: { type: Number, default: 0 },
    coa: { type: Number, default: 0 },
    unixLinux: { type: Number, default: 0 }
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
    const { roll, dob, name, gender, fatherName, motherName, phone, email, aadhaar, address, marks10, marks12, subjects, role } = req.body;
    let student = await Student.findOne({ roll });
    
    const updatePayload = {
      dob, name, gender, fatherName, motherName, phone, email, aadhaar, address,
      marks10: Number(marks10), marks12: Number(marks12), subjects, uploadedAt: new Date()
    };

    if (student) {
      await Student.findOneAndUpdate({ roll }, { $set: updatePayload });
    } else {
      student = new Student({ roll, ...updatePayload });
      await student.save();
    }
    
    const log = new Log({ action: "Admission Profile Synced for Roll: " + roll, performedBy: role });
    await log.save();
    res.status(200).json({ success: true, message: "Profile Saved!" });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post("/api/get-result", async (req, res) => {
  try {
    let config = await Config.findOne({ configId: "global" });
    if (!config || !config.isPublished) return res.status(403).json({ success: false, message: "System Withheld by Administration." });
    const { roll, dob } = req.body;
    const student = await Student.findOne({ roll, dob });
    if (student) res.status(200).json({ success: true, data: student });
    else res.status(404).json({ success: false, message: "No profile matching found!" });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

/* ========================================================================================= */
/* 📍 LINE CHECKPOINT 100: DATABASE DATA FETCH ROUTES STARTING HERE */
/* ========================================================================================= */

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
        .main-nav { display: flex; gap: 20px; margin-bottom: 30px; width: 100%; max-width: 480px; }
        .nav-btn { flex: 1; background: #1e293b; border: 2px solid #334155; padding: 15px; border-radius: 12px; color: #f8fafc; cursor: pointer; font-size: 1rem; font-weight: 600; }
        .nav-btn.active { border-color: #38bdf8; background: #1e293b; box-shadow: 0 0 15px rgba(56, 189, 248, 0.2); }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 520px; padding: 25px; display: none; }
        .card.visible { display: block; }
        h2 { font-size: 1.4rem; color: #f1f5f9; margin-bottom: 20px; text-align: center; border-bottom: 1px solid #334155; padding-bottom: 10px; }
        .form-group { margin-bottom: 15px; }
        .form-row { display: flex; gap: 15px; margin-bottom: 15px; }
        .form-row .form-group { flex: 1; margin-bottom: 0; }
        label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 6px; }
        input, select { width: 100%; background: #0f172a; border: 1px solid #475569; border-radius: 8px; padding: 10px 14px; color: #f8fafc; }
        input:focus { outline: none; border-color: #38bdf8; }
        .btn { width: 100%; padding: 12px; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 10px; }
        .btn-primary { background: #ef4444; color: white; }
        .btn-secondary { background: #475569; color: white; }
        .status-msg { margin-top: 15px; text-align: center; font-size: 0.9rem; font-weight: 600; }
        .success { color: #4ade80; } .error { color: #f87171; }
        .marksheet { background: #1e293b; border-radius: 12px; padding: 20px; margin-top: 20px; border: 1px dashed #475569; color: #f1f5f9;}
        .section-title { font-size: 0.9rem; color: #38bdf8; font-weight: bold; text-transform: uppercase; margin: 15px 0 5px 0; border-bottom: 1px solid #334155; padding-bottom: 3px;}
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85rem; padding: 5px 0; }
        .admin-controls { background: #0f172a; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px dashed #8b5cf6; display: none; }
        .captcha-box { border: 1px solid #475569; padding: 10px; text-align: center; border-radius: 8px; background: #0f172a; margin-top: 10px; color: #94a3b8; font-size: 0.85rem;}
        .view-records-container { margin-top: 20px; background: #0f172a; padding: 15px; border-radius: 8px; border: 1px solid #475569; max-height: 250px; overflow-y: auto;}
        .record-item { border-bottom: 1px solid #334155; padding: 10px 0; font-size: 0.85rem; }
      </style>
    </head>
    <body>

      <div class="header">
        <h1>🎓 SITM COLLEGE</h1>
        <p>Unified Examination & Admission Management Portal</p>
      </div>

      <div class="main-nav" id="mainNav">
        <button class="nav-btn active" id="btnTabStudent" onclick="switchTab('student')">🧑‍🎓 Student Desk</button>
        <button class="nav-btn" id="btnTabTeacher" onclick="switchTab('teacher')">🛡️ Staff Login</button>
      </div>

      <!-- STUDENT PORTAL -->
      <div id="studentCard" class="card visible">
        <h2>Student Profile Access</h2>
        <div class="form-group"><label>Roll Number</label><input type="text" id="studentRoll"></div>
        <div class="form-group"><label>Date of Birth</label><input type="date" id="studentDob"></div>
        <div class="captcha-box"><input type="checkbox" id="mockCaptcha" style="width: auto;"> <span>Secure reCAPTCHA System Verification</span></div>
        <button class="btn" style="background:#38bdf8; color:#0f172a;" onclick="fetchStudentResult()">Fetch Admission Profile</button>
        <div id="studentStatus" class="status-msg"></div>
        <div id="marksheetView" style="display:none;" class="marksheet"></div>
        <button id="downloadPdfBtn" class="btn btn-secondary" style="display:none;" onclick="downloadPDF()">⬇️ Download Complete Admission File</button>
      </div>

      <!-- AUTH PORTAL -->
      <div id="teacherAuthCard" class="card">
        <h2>Secure Staff Access</h2>
        <div class="form-group"><label>Security Password</label><input type="password" id="teacherPassword"></div>
        <button class="btn" style="background:#4ade80; color:#0f172a;" onclick="verifyAuth()">Authorize Dashboard</button>
        <div id="authStatus" class="status-msg"></div>
      </div>

      <!-- STAFF DASHBOARD -->
      <div id="teacherDashboardCard" class="card">
        <h2>Admission & Profile Registry</h2>

/* ========================================================================================= */
/* 📍 LINE CHECKPOINT 200: STAFF LAYOUT SECTIONS LOADED SUCCESSFULLY */
/* ========================================================================================= */

        <div id="adminPanel" class="admin-controls">
           <p style="font-size:0.85rem; margin-bottom:10px;">Status: <b id="publishStatusTxt">Checking...</b></p>
           <button class="btn btn-primary" style="background:#8b5cf6;" onclick="togglePublish()">Toggle Publish/Hide System</button>
           <button class="btn btn-secondary" style="background:#475569; margin-top:10px;" onclick="viewAllRecords()">📂 View Complete Cloud Database</button>
           <div id="allRecordsContainer" class="view-records-container" style="display:none;"><div id="recordsList"></div></div>
        </div>

        <div class="section-title">1. Personal Details</div>
        <div class="form-row">
          <div class="form-group"><label>Student Name</label><input type="text" id="resName"></div>
          <div class="form-group"><label>Gender</label><select id="resGender"><option value="Male">Male</option><option value="Female">Female</option></select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Roll Number</label><input type="text" id="resRoll"></div>
          <div class="form-group"><label>Date of Birth</label><input type="date" id="resDob"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Father's Name</label><input type="text" id="resFather"></div>
          <div class="form-group"><label>Mother's Name</label><input type="text" id="resMother"></div>
        </div>

        <div class="section-title">2. Contact & Verification</div>
        <div class="form-row">
          <div class="form-group"><label>Phone Number</label><input type="text" id="resPhone"></div>
          <div class="form-group"><label>Email ID</label><input type="email" id="resEmail"></div>
        </div>
        <div class="form-group"><label>Aadhaar Card Number</label><input type="text" id="resAadhaar"></div>
        <div class="form-group"><label>Permanent Address</label><input type="text" id="resAddress"></div>

        <div class="section-title">3. Academic History & Performance</div>
        <div class="form-row">
          <div class="form-group"><label>10th Percentage (%)</label><input type="number" id="res10th" step="0.01"></div>
          <div class="form-group"><label>12th Percentage (%)</label><input type="number" id="res12th" step="0.01"></div>
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

        <button class="btn btn-primary" style="background:#4ade80; color:#0f172a; margin-top:20px;" onclick="publishResult()">Save Full Admission Profile</button>
        <div id="publishStatus" class="status-msg"></div>
        <button class="btn btn-secondary" onclick="logoutTeacher()">← Logout Securely</button>
      </div>

      <div id="pdf-container" style="display:none; padding:40px; color:#000000; background:#ffffff;"></div>

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
            currentRole = "Admin"; status.innerHTML = "<span class='success'>✓ Authorized</span>";
            document.getElementById('adminPanel').style.display = "block";
            checkPublishStatus(); openDashboard();
          } else if(pass === 'cse_teacher_2026') {
            currentRole = "Teacher"; status.innerHTML = "<span class='success'>✓ Authorized</span>";
            document.getElementById('adminPanel').style.display = "none";
            openDashboard();
          } else { status.innerHTML = "<span class='error'>❌ Refused</span>"; }
        }

/* ========================================================================================= */
/* 📍 LINE CHECKPOINT 300: MIDDLE SCRIPTS AND AJAX REQUEST PIPELINE */
/* ========================================================================================= */

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
            document.getElementById('publishStatusTxt').innerText = data.isPublished ? "🟢 Active LIVE" : "🔴 Active HIDDEN";
          } catch(e) {}
        }

        async function togglePublish() {
          try {
            const res = await fetch('/api/toggle-publish', { method: 'POST' });
            const data = await res.json();
            document.getElementById('publishStatusTxt').innerText = data.isPublished ? "🟢 Active LIVE" : "🔴 Active HIDDEN";
          } catch(e) {}
        }

        async function viewAllRecords() {
          const container = document.getElementById('allRecordsContainer');
          const list = document.getElementById('recordsList');
          try {
            const res = await fetch('/api/all-results');
            const out = await res.json();
            if(out.success && out.data.length > 0) {
              list.innerHTML = out.data.map(function(d) {
                return '<div class="record-item"><b>👤 ' + d.name + ' (Roll: ' + d.roll + ')</b><br>📞 ' + (d.phone || 'N/A') + ' | 🏠 ' + (d.address || 'N/A') + '</div>';
              }).join('');
              container.style.display = 'block';
            }
          } catch(err) { alert("Error connecting database cluster."); }
        }

        async function publishResult() {
          const status = document.getElementById('publishStatus');
          const data = {
            role: currentRole,
            name: document.getElementById('resName').value,
            gender: document.getElementById('resGender').value,
            roll: document.getElementById('resRoll').value,
            dob: document.getElementById('resDob').value.split('-').reverse().join('/'),
            fatherName: document.getElementById('resFather').value,
            motherName: document.getElementById('resMother').value,
            phone: document.getElementById('resPhone').value,
            email: document.getElementById('resEmail').value,
            aadhaar: document.getElementById('resAadhaar').value,
            address: document.getElementById('resAddress').value,
            marks10: Number(document.getElementById('res10th').value),
            marks12: Number(document.getElementById('res12th').value),
            subjects: {
              java: Number(document.getElementById('subJava').value),
              rProg: Number(document.getElementById('subR').value),
              os: Number(document.getElementById('subOs').value),
              coa: Number(document.getElementById('subCoa').value),
              unixLinux: Number(document.getElementById('subUnix').value)
            }
          };

          if(!data.name || !data.roll || !data.dob) { alert("Complete primary fields!"); return; }
          status.innerHTML = "⏳ Saving into Secure Cloud Network...";
          try {
            const res = await fetch('/api/add-result', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(data)
            });
            const out = await res.json();
            if(out.success) { status.innerHTML = "<span class='success'>✓ Admission Ledger Synced!</span>"; }
          } catch(err) { status.innerHTML = "<span class='error'>❌ Sync Broken</span>"; }
        }

/* ========================================================================================= */
/* 📍 LINE CHECKPOINT 400: PROFILE RENDERING & ENGINE STABILITY ROUTINES */
/* ========================================================================================= */

        async function fetchStudentResult() {
          const roll = document.getElementById('studentRoll').value;
          let dob = document.getElementById('studentDob').value;
          const status = document.getElementById('studentStatus');
          const msk = document.getElementById('marksheetView');
          const pdfBtn = document.getElementById('downloadPdfBtn');
          
          if(!roll || !dob || !document.getElementById('mockCaptcha').checked) {
            alert("Fill entries & verify Captcha!"); return;
          }
          dob = dob.split('-').reverse().join('/');
          status.innerHTML = '⏳ Accessing Profile Database...';
          
          try {
            const res = await fetch('/api/get-result', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ roll, dob })
            });
            const out = await res.json();
            if(out.success) {
              status.innerHTML = "<span class='success'>✓ Identity Verified!</span>";
              const d = out.data;
              const total = d.subjects.java + d.subjects.rProg + d.subjects.os + d.subjects.coa + d.subjects.unixLinux;
              
              msk.innerHTML = '<div style="text-align:center; font-weight:bold; font-size:1.1rem; border-bottom:2px solid #38bdf8; margin-bottom:10px; padding-bottom:5px;">SITM VERIFIED ADMISSION SLIP</div>' +
                '<div class="section-title">Identity Parameters</div>' +
                '<div class="info-grid"><span><b>Name:</b> ' + d.name + '</span><span><b>Gender:</b> ' + (d.gender || 'Male') + '</span></div>' +
                '<div class="info-grid"><span><b>Roll Number:</b> ' + d.roll + '</span><span><b>DOB:</b> ' + d.dob + '</span></div>' +
                '<div class="info-grid"><span><b>Father:</b> ' + (d.fatherName || 'N/A') + '</span><span><b>Mother:</b> ' + (d.motherName || 'N/A') + '</span></div>' +
                '<div class="section-title">Contact & Cloud Verification</div>' +
                '<div class="info-grid"><span><b>Phone:</b> ' + (d.phone || 'N/A') + '</span><span><b>Email:</b> ' + (d.email || 'N/A') + '</span></div>' +
                '<div class="info-grid"><span><b>Aadhaar UID:</b> XXXX-XXXX-' + (d.aadhaar ? d.aadhaar.slice(-4) : '0000') + '</span><span><b>Course:</b> ' + d.course + '</span></div>' +
                '<div style="font-size:0.85rem; margin-top:5px;"><b>Permanent Address:</b> ' + (d.address || 'N/A') + '</div>' +
                '<div class="section-title">Prior Academics</div>' +
                '<div class="info-grid"><span><b>10th Percentage:</b> ' + (d.marks10 || 0) + '%</span><span><b>12th Percentage:</b> ' + (d.marks12 || 0) + '%</span></div>' +
                '<div class="section-title">B.Tech Current Sem Scores</div>' +
                '<div class="info-grid"><span>Java: ' + d.subjects.java + '</span><span>R Prog: ' + d.subjects.rProg + '</span></div>' +
                '<div class="info-grid"><span>OS: ' + d.subjects.os + '</span><span>COA: ' + d.subjects.coa + '</span></div>' +
                '<div style="font-size:0.85rem;">Unix/Linux: ' + d.subjects.unixLinux + '</div>' +
                '<div style="margin-top:10px; font-weight:bold; color:#38bdf8; font-size:1rem; border-top:1px solid #334155; padding-top:8px;">Aggregate Score: ' + total + '/500</div>';
              
              msk.style.display = 'block'; pdfBtn.style.display = 'block';
            } else { status.innerHTML = "<span class='error'>❌ " + out.message + "</span>"; }
          } catch(e) { status.innerHTML = "<span class='error'>❌ Cloud Failure</span>"; }
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
                body: JSON.stringify({ name: d.name, roll: d.roll, dob: d.dob, course: d.course, subjects: d.subjects, total, pct })}
              });
              const pdfOut = await pdfRes.json();
              if(pdfOut.success) {
                const container = document.getElementById('pdf-container');
                container.innerHTML = pdfOut.htmlContent; container.style.display = 'block';
                const opt = { margin: 15, filename: 'SITM_Admission_Profile_' + roll + '.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }};
                setTimeout(function() { html2pdf().set(opt).from(container).save().then(function() { container.style.display = 'none'; }); }, 500);
              }
            }
          } catch(err) { alert("Compiling pipeline disrupted."); }
        }
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server active on " + PORT));

/* ========================================================================================= */
/* 📍 LINE CHECKPOINT 500: END OF SEVER CONFIGURATION FILE */
/* ========================================================================================= */
                                     
