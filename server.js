const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());

// Hardcoded Secure MongoDB Connection
const MONGO_URI = "mongodb+srv://sumitsharma17361_db_user:S26CzHyqdBgLuFuw@cluster0.ihz6w8n.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log("Cloud Cluster Database Connected Successfully!"))
  .catch(err => console.error("Cloud DB Connection Error:", err));

// MongoDB Student Schema Layout
const studentSchema = new mongoose.Schema({
  roll: { type: String, required: true, unique: true },
  dob: { type: String, required: true },
  name: { type: String, required: true },
  course: { type: String, default: "B.Tech CSE" },
  subjects: {
    java: { type: Number, required: true },
    rProg: { type: Number, required: true },
    os: { type: Number, required: true },
    coa: { type: Number, required: true },
    unixLinux: { type: Number, required: true }
  },
  uploadedAt: { type: Date, default: Date.now }
});

const Student = mongoose.model("Student", studentSchema);

// API Routes
app.post("/api/add-result", async (codeReq, codeRes) => {
  try {
    const { roll, dob, name, subjects } = codeReq.body;
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
    codeRes.status(200).json({ success: true, message: "Result published to cloud successfully!" });
  } catch (error) {
    codeRes.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/get-result", async (codeReq, codeRes) => {
  try {
    const { roll, dob } = codeReq.body;
    const student = await Student.findOne({ roll, dob });
    if (student) {
      codeRes.status(200).json({ success: true, data: student });
    } else {
      codeRes.status(404).json({ success: false, message: "No record found! Check Roll No & DOB." });
    }
  } catch (error) {
    codeRes.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/all-results", async (codeReq, codeRes) => {
  try {
    const allStudents = await Student.find({}).sort({ uploadedAt: -1 });
    codeRes.status(200).json({ success: true, data: allStudents });
  } catch (error) {
    codeRes.status(500).json({ success: false, error: error.message });
  }
});

// Frontend User Interface
app.get("/", (codeReq, codeRes) => {
  codeRes.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tech University Portal</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
        body { background-color: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; min-height: 100vh; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #38bdf8; font-size: 2.2rem; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .header p { color: #94a3b8; font-size: 0.95rem; margin-top: 5px; }
        .main-nav { display: flex; gap: 20px; margin-bottom: 30px; width: 100%; max-width: 450px; }
        .nav-btn { flex: 1; background: #1e293b; border: 2px solid #334155; padding: 15px; border-radius: 12px; color: #f8fafc; cursor: pointer; font-size: 1rem; font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 8px; transition: 0.2s; }
        .nav-btn.active { border-color: #38bdf8; background: #1e293b; box-shadow: 0 0 15px rgba(56, 189, 248, 0.2); }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 450px; padding: 25px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); display: none; }
        .card.visible { display: block; }
        h2 { font-size: 1.4rem; color: #f1f5f9; margin-bottom: 20px; text-align: center; border-bottom: 1px solid #334155; padding-bottom: 10px; }
        .form-group { margin-bottom: 15px; }
        .form-row { display: flex; gap: 15px; margin-bottom: 15px; }
        .form-row .form-group { flex: 1; margin-bottom: 0; }
        label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 6px; font-weight: 500; }
        input, select { width: 100%; background: #0f172a; border: 1px solid #475569; border-radius: 8px; padding: 10px 14px; color: #f8fafc; font-size: 0.95rem; transition: 0.2s; }
        input:focus { outline: none; border-color: #38bdf8; }
        .btn { width: 100%; padding: 12px; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: 0.2s; margin-top: 10px; }
        .btn-primary { background: #ef4444; color: white; }
        .btn-primary:hover { background: #dc2626; }
        .btn-secondary { background: #475569; color: white; margin-top: 10px; }
        .btn-secondary:hover { background: #334155; }
        .btn-view-all { background: #334155; border: 1px solid #475569; color: #38bdf8; }
        .btn-view-all:hover { background: #475569; }
        .status-msg { margin-top: 15px; text-align: center; font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .success { color: #4ade80; }
        .error { color: #f87171; }
        .badge-counter { background: #0369a1; color: #e0f2fe; padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; margin-bottom: 15px; display: inline-block; text-align: center; }
        .search-box { margin-bottom: 15px; }
        .table-container { width: 100%; overflow-x: auto; margin-top: 15px; border-radius: 8px; border: 1px solid #334155; }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; min-width: 500px; }
        th, td { padding: 10px 12px; border-bottom: 1px solid #334155; }
        th { background: #0f172a; color: #94a3b8; font-weight: 600; }
        tr:hover { background: #1e293b; }
        .fail-mark { color: #f87171; font-weight: bold; }
        .pass-mark { color: #4ade80; }
        .marksheet { background: #1e293b; border-radius: 12px; padding: 20px; margin-top: 20px; border: 1px dashed #475569; }
        .marksheet-header { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #475569; padding-bottom: 8px; }
        .marksheet-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.9rem; }
        .total-row { border-top: 1px solid #475569; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 1rem; color: #38bdf8; }
      </style>
    </head>
    <body>

      <div class="header">
        <h1>🎓 Tech University</h1>
        <p>Unified Examination Management Portal</p>
      </div>

      <div class="main-nav" id="mainNav">
        <button class="nav-btn active" onclick="switchTab('student')">🧑‍🎓<br>Student Portal</button>
        <button class="nav-btn" onclick="switchTab('teacher')">🧑‍🏫<br>Teacher Portal</button>
      </div>

      <!-- STUDENT SCREEN -->
      <div id="studentCard" class="card visible">
        <h2>Student Access Corner</h2>
        <div class="form-group">
          <label>Roll Number</label>
          <input type="text" id="studentRoll" placeholder="e.g. 24">
        </div>
        <div class="form-group">
          <label>Date of Birth</label>
          <input type="date" id="studentDob">
        </div>
        <button class="btn btn-primary" style="background:#38bdf8; color:#0f172a;" onclick="fetchStudentResult()">View Marksheet</button>
        <div id="studentStatus" class="status-msg"></div>
        
        <div id="marksheetView" style="display:none;" class="marksheet"></div>
      </div>

      <!-- TEACHER AUTH SCREEN -->
      <div id="teacherAuthCard" class="card">
        <h2>Teacher Secure Login</h2>
        <div class="form-group">
          <label>Enter Portal Security Password</label>
          <input type="password" id="teacherPassword" placeholder="Enter password...">
        </div>
        <button class="btn btn-primary" style="background:#4ade80; color:#0f172a;" onclick="verifyTeacherAuth()">Verify & Grant Access</button>
        <div id="authStatus" class="status-msg"></div>
      </div>

      <!-- TEACHER DASHBOARD SCREEN -->
      <div id="teacherDashboardCard" class="card">
        <h2>Teacher Management Dashboard</h2>
        <center><div id="totalCounter" class="badge-counter">Loading cloud data...</div></center>
        
        <div class="form-group">
          <label>Student Name</label>
          <input type="text" id="resName" placeholder="Full Name">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Roll Number</label>
            <input type="text" id="resRoll" placeholder="Roll No.">
          </div>
          <div class="form-group">
            <label>Date of Birth</label>
            <input type="date" id="resDob">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Java</label>
            <input type="number" id="subJava" placeholder="0-100">
          </div>
          <div class="form-group">
            <label>R Prog</label>
            <input type="number" id="subR" placeholder="0-100">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>OS</label>
            <input type="number" id="subOs" placeholder="0-100">
          </div>
          <div class="form-group">
            <label>COA</label>
            <input type="number" id="subCoa" placeholder="0-100">
          </div>
        </div>
        <div class="form-group">
          <label>Unix / Linux</label>
          <input type="number" id="subUnix" placeholder="0-100">
        </div>

        <button class="btn btn-primary" onclick="publishResult()">Publish Result</button>
        <button class="btn btn-secondary btn-view-all" onclick="loadAllUploadedResults()">📊 View All Uploaded Results</button>
        
        <div id="publishStatus" class="status-msg"></div>
        <button class="btn btn-secondary" onclick="logoutTeacher()">← Logout</button>
      </div>

      <!-- ALL RESULTS VIEW CARD -->
      <div id="allResultsCard" class="card" style="max-width: 700px;">
        <h2>All Uploaded University Records</h2>
        <div class="form-group search-box">
          <input type="text" id="resultSearch" onkeyup="filterResultsTable()" placeholder="🔍 Search by Name or Roll Number...">
        </div>
        <div id="tableStatus" class="status-msg"></div>
        <div class="table-container">
          <table id="resultsTable">
            <thead>
              <tr>
                <th>Roll</th>
                <th>Name</th>
                <th>Java</th>
                <th>R Prog</th>
                <th>OS</th>
                <th>COA</th>
                <th>Unix</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody id="resultsTableBody"></tbody>
          </table>
        </div>
        <button class="btn btn-secondary" onclick="backToDashboard()">← Back to Dashboard</button>
      </div>

      <script>
        let allFetchedRecords = [];

        function switchTab(tab) {
          document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
          document.querySelectorAll('.card').forEach(c => c.classList.remove('visible'));
          document.getElementById('marksheetView').style.display = 'none';
          document.getElementById('studentStatus').innerHTML = '';
          document.getElementById('authStatus').innerHTML = '';
          document.getElementById('publishStatus').innerHTML = '';
          
          if(tab === 'student') {
            document.querySelectorAll('.nav-btn')[0].classList.add('active');
            document.getElementById('studentCard').classList.add('visible');
          } else {
            document.querySelectorAll('.nav-btn')[1].classList.add('active');
            document.getElementById('teacherAuthCard').classList.add('visible');
          }
        }

        function verifyTeacherAuth() {
          const pass = document.getElementById('teacherPassword').value;
          const authStatus = document.getElementById('authStatus');
          if(pass === 'cse_teacher_2026') {
            authStatus.innerHTML = "<span class='success'>✓ Access Granted! Fetching metrics...</span>";
            setTimeout(() => {
              document.getElementById('teacherAuthCard').classList.remove('visible');
              document.getElementById('teacherDashboardCard').classList.add('visible');
              document.getElementById('mainNav').style.display = 'none';
              updateTotalCount();
            }, 800);
          } else {
            authStatus.innerHTML = "<span class='error'>❌ Invalid Security Password!</span>";
          }
        }

        // FIX: Logout completely clears password state and input fields
        function logoutTeacher() {
          document.getElementById('teacherPassword').value = ''; 
          document.getElementById('authStatus').innerHTML = '';
          document.getElementById('publishStatus').innerHTML = '';
          
          // Clear input fields inside dashboard
          document.getElementById('resName').value = '';
          document.getElementById('resRoll').value = '';
          document.getElementById('resDob').value = '';
          document.getElementById('subJava').value = '';
          document.getElementById('subR').value = '';
          document.getElementById('subOs').value = '';
          document.getElementById('subCoa').value = '';
          document.getElementById('subUnix').value = '';

          document.getElementById('teacherDashboardCard').classList.remove('visible');
          document.getElementById('mainNav').style.display = 'flex';
          switchTab('student');
        }

        async function updateTotalCount() {
          try {
            const response = await fetch('/api/all-results');
            const result = await response.json();
            if(result.success) {
              document.getElementById('totalCounter').innerText = "📊 Cloud System Sync: " + result.data.length + " Student Records Live";
            }
          } catch(e) {
            document.getElementById('totalCounter').innerText = "📊 Cloud System Sync: Active";
          }
        }

        async function publishResult() {
          const status = document.getElementById('publishStatus');
          const data = {
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

          if(!data.name || !data.roll || !data.dob || isNaN(data.subjects.java)) {
            status.innerHTML = "<span class='error'>❌ Complete all inputs properly!</span>";
            return;
          }

          try {
            status.innerHTML = "⏳ Syncing with MongoDB Atlas...";
            const res = await fetch('/api/add-result', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(data)
            });
            const out = await res.json();
            if(out.success) {
              status.innerHTML = "<span class='success'>❌ Published to Cloud Cluster Successfully!</span>";
              updateTotalCount();
            } else {
              status.innerHTML = "<span class='error'>❌ Database Save Failure!</span>";
            }
          } catch(err) {
            status.innerHTML = "<span class='error'>❌ Database Save Failure!</span>";
          }
        }

        async function loadAllUploadedResults() {
          const tableBody = document.getElementById('resultsTableBody');
          const status = document.getElementById('tableStatus');
          tableBody.innerHTML = '';
          status.innerHTML = '⏳ Loading cloud data items...';

          document.getElementById('teacherDashboardCard').classList.remove('visible');
          document.getElementById('allResultsCard').classList.add('visible');

          try {
            const res = await fetch('/api/all-results');
            const out = await res.json();
            if(out.success && out.data.length > 0) {
              status.innerHTML = '';
              allFetchedRecords = out.data; // Cache for search feature
              renderTableRows(allFetchedRecords);
            } else {
              status.innerHTML = "<span class='error'>❌ Database Fetch Failure or No Records Found!</span>";
            }
          } catch(e) {
            status.innerHTML = "<span class='error'>❌ Database Fetch Failure!</span>";
          }
        }

        function renderTableRows(records) {
          const tableBody = document.getElementById('resultsTableBody');
          tableBody.innerHTML = '';
          records.forEach(st => {
            const dateStr = new Date(st.uploadedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            
            // Helper to dynamic format fail marks (<33)
            const fmt = (m) => m < 33 ? \`<span class="fail-mark">\${m}</span>\` : \`<span class="pass-mark">\${m}</span>\`;

            const row = \`<tr>
              <td>\${st.roll}</td>
              <td><b>\${st.name}</b></td>
              <td>\${fmt(st.subjects.java)}</td>
              <td>\${fmt(st.subjects.rProg)}</td>
              <td>\${fmt(st.subjects.os)}</td>
              <td>\${fmt(st.subjects.coa)}</td>
              <td>\${fmt(st.subjects.unixLinux)}</td>
              <td style="color:#94a3b8; font-size:0.75rem;">\${dateStr}</td>
            </tr>\`;
            tableBody.innerHTML += row;
          });
        }

        // EXTRA FEATURE: Real-time search functionality
        function filterResultsTable() {
          const query = document.getElementById('resultSearch').value.toLowerCase();
          const filtered = allFetchedRecords.filter(st => 
            st.name.toLowerCase().includes(query) || st.roll.toString().includes(query)
          );
          renderTableRows(filtered);
        }

        function backToDashboard() {
          document.getElementById('resultSearch').value = '';
          document.getElementById('allResultsCard').classList.remove('visible');
          document.getElementById('teacherDashboardCard').classList.add('visible');
          updateTotalCount();
        }

        async function fetchStudentResult() {
          const roll = document.getElementById('studentRoll').value;
          let dob = document.getElementById('studentDob').value;
          const status = document.getElementById('studentStatus');
          const msk = document.getElementById('marksheetView');
          
          if(!roll || !dob) {
            status.innerHTML = "<span class='error'>❌ Enter Roll Number & Date of Birth!</span>";
            return;
          }
          
          dob = dob.split('-').reverse().join('/');
          status.innerHTML = '⏳ Accessing Cloud Database Node...';
          msk.style.display = 'none';

          try {
            const res = await fetch('/api/get-result', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.string
