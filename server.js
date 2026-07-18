const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());

const TEACHER_PASSWORD = "cse_teacher_2026"; 

// Cloud Database Connection (Injected by Render environment variables)
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("Cloud Cluster Database Connected Successfully!"))
  .catch(err => console.error("Cloud DB Connection Error:", err));

// MongoDB Student Schema Layout
const studentSchema = new mongoose.Schema({
    roll: { type: String, required: true, unique: true },
    dob: { type: String, required: true },
    name: { type: String, required: true },
    course: { type: String, default: "B.Tech CSE - 4th Semester" },
    marks: {
        Java: Number,
        "R Programming": Number,
        "Operating Systems": Number,
        "COA": Number,
        "Unix/Linux": Number
    },
    cgpa: String,
    status: String
});

const Student = mongoose.model("Student", studentSchema);

// SINGLE UNIFIED FRONTEND INTERFACE
app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tech University Portal</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, sans-serif; }
            body { background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; min-height: 100vh; padding: 20px; }
            .main-header { text-align: center; margin-bottom: 40px; margin-top: 20px; }
            .main-header h1 { color: #38bdf8; font-size: 2.5rem; font-weight: 800; letter-spacing: -0.05em; }
            .main-header p { color: #94a3b8; margin-top: 5px; }
            .card { background: #1e293b; width: 100%; max-width: 480px; padding: 30px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); border: 1px solid #334155; display: none; text-align: center; }
            .card.active { display: block; animation: fadeIn 0.4s ease-in-out; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            h2 { margin-bottom: 20px; color: #f1f5f9; font-size: 1.5rem; }
            .btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%; max-width: 450px; }
            .role-btn { background: #1e293b; border: 2px solid #334155; color: #f1f5f9; padding: 30px 20px; border-radius: 12px; cursor: pointer; font-size: 1.1rem; font-weight: 600; transition: all 0.3s; display: flex; flex-direction: column; align-items: center; gap: 10px; }
            .role-btn:hover { border-color: #38bdf8; background: #0f172a; transform: translateY(-2px); }
            .input-group { margin-bottom: 15px; text-align: left; }
            label { display: block; margin-bottom: 6px; font-size: 0.9rem; color: #94a3b8; font-weight: 500; }
            input { width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; font-size: 1rem; color: white; transition: 0.3s; }
            input:focus { border-color: #38bdf8; outline: none; }
            .primary-btn { width: 100%; padding: 12px; background: #38bdf8; color: #0f172a; border: none; border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: 0.3s; margin-top: 10px; }
            .primary-btn:hover { background: #7dd3fc; }
            .back-btn { background: transparent; border: 1px solid #475569; color: #94a3b8; margin-top: 15px; width: auto; padding: 8px 16px; font-size: 0.9rem; }
            .back-btn:hover { color: white; border-color: white; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; background: #0f172a; border-radius: 8px; overflow: hidden; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #334155; }
            th { background: #334155; color: #38bdf8; font-weight: 600; }
            .badge { padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 0.85rem; }
            .pass { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
            .fail { background: rgba(239, 68, 68, 0.2); color: #f87171; }
            .error { color: #f87171; font-size: 0.95rem; margin-top: 10px; font-weight: 500; }
        </style>
    </head>
    <body>
        <div class="main-header">
            <h1>🎓 Tech University</h1>
            <p>Unified Examination Management Portal</p>
        </div>

        <div id="welcome-screen" class="btn-grid card active" style="background:transparent; border:none; box-shadow:none;">
            <button class="role-btn" onclick="switchView('student-card')"><span>👨‍🎓</span>Student Portal</button>
            <button class="role-btn" onclick="switchView('auth-card')"><span>👨‍🏫</span>Teacher Portal</button>
        </div>

        <div id="auth-card" class="card">
            <h2>Verification Required</h2>
            <div class="input-group"><label>Enter Secret Security Password</label><input type="password" id="auth-pass" placeholder="••••••••"></div>
            <button class="primary-btn" onclick="verifyTeacher()">Verify & Enter</button>
            <div id="auth-error" class="error"></div>
            <button class="primary-btn back-btn" onclick="switchView('welcome-screen')">← Back</button>
        </div>

        <div id="student-card" class="card">
            <h2>Student Access Corner</h2>
            <div class="input-group"><label>Roll Number</label><input type="text" id="s-roll" placeholder="e.g. 2401"></div>
            <div class="input-group"><label>Date of Birth</label><input type="date" id="s-dob"></div>
            <button class="primary-btn" onclick="fetchStudentResult()">View Marksheet</button>
            <div id="s-error" class="error"></div>
            <button class="primary-btn back-btn" onclick="switchView('welcome-screen')">← Back</button>
        </div>

        <div id="result-card" class="card" style="max-width: 550px;">
            <h2>Academic Performance Card</h2>
            <div style="background:#0f172a; padding:15px; border-radius:8px; text-align:left; margin-bottom:15px; border-left: 4px solid #38bdf8;">
                <p style="margin-bottom:5px;"><strong>Name:</strong> <span id="res-name" style="color:#38bdf8;"></span></p>
                <p style="margin-bottom:5px;"><strong>Course:</strong> <span id="res-course"></span></p>
                <p><strong>Status:</strong> <span id="res-status" class="badge"></span></p>
            </div>
            <table id="marks-table"></table>
            <h3 style="text-align: right; margin-top:15px; color:#38bdf8;">Final CGPA: <span id="res-cgpa"></span></h3>
            <button class="primary-btn back-btn" onclick="switchView('student-card')">← Back</button>
        </div>

        <div id="teacher-card" class="card">
            <h2 style="color:#f43f5e;">👨‍🏫 Teacher Grading Panel</h2>
            <div class="input-group"><label>Student Name</label><input type="text" id="t-name"></div>
            <div class="input-group"><label>Roll Number</label><input type="text" id="t-roll"></div>
            <div class="input-group"><label>Date of Birth</label><input type="date" id="t-dob"></div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div class="input-group"><label>Java</label><input type="number" id="m-java"></div>
                <div class="input-group"><label>R Prog</label><input type="number" id="m-r"></div>
                <div class="input-group"><label>OS</label><input type="number" id="m-os"></div>
                <div class="input-group"><label>COA</label><input type="number" id="m-coa"></div>
            </div>
            <div class="input-group"><label>Unix / Linux</label><input type="number" id="m-unix"></div>
            <button class="primary-btn" style="background:#f43f5e; color:white;" onclick="uploadStudentResult()">Publish Result</button>
            <div id="t-msg" class="error" style="color: #f43f5e;"></div>
            <button class="primary-btn back-btn" onclick="switchView('welcome-screen')">← Logout</button>
        </div>

        <script>
            let currentActiveToken = "";
            function switchView(cardId) {
                document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
                document.getElementById(cardId).classList.add('active');
            }
            function verifyTeacher() {
                const pass = document.getElementById('auth-pass').value;
                if(pass === "${TEACHER_PASSWORD}") {
                    currentActiveToken = pass;
                    document.getElementById('auth-error').innerText = "";
                    switchView('teacher-card');
                } else { document.getElementById('auth-error').innerText = "❌ Access Denied!"; }
            }
            async function fetchStudentResult() {
                const roll = document.getElementById('s-roll').value.trim();
                const dob = document.getElementById('s-dob').value;
                const err = document.getElementById('s-error');
                if(!roll || !dob) return err.innerText = "⚠️ Fill all credentials!";
                
                let res = await fetch('/api/get-result', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({roll, dob})
                });
                let data = await res.json();
                if(data.error) { err.innerText = "❌ " + data.error; } 
                else {
                    err.innerText = ""; switchView('result-card');
                    document.getElementById('res-name').innerText = data.name;
                    document.getElementById('res-course').innerText = data.course;
                    document.getElementById('res-cgpa').innerText = data.cgpa;
                    const badge = document.getElementById('res-status');
                    badge.innerText = data.status;
                    badge.className = "badge " + (data.status === 'PASS' ? 'pass' : 'fail');
                    let table = document.getElementById('marks-table');
                    table.innerHTML = '<tr><th>Subject</th><th>Marks</th></tr>';
                    for(let sub in data.marks) {
                        table.innerHTML += \`<tr><td>\${sub}</td><td style="font-weight:bold;">\${data.marks[sub]}</td></tr>\`;
                    }
                }
            }
            async function uploadStudentResult() {
                const msg = document.getElementById('t-msg');
                const name = document.getElementById('t-name').value.trim();
                const roll = document.getElementById('t-roll').value.trim();
                const dob = document.getElementById('t-dob').value;
                const java = document.getElementById('m-java').value;
                const rProg = document.getElementById('m-r').value;
                const os = document.getElementById('m-os').value;
                const coa = document.getElementById('m-coa').value;
                const unix = document.getElementById('m-unix').value;

                if(!name || !roll || !dob || java==="" || rProg==="" || os==="" || coa==="" || unix==="") {
                    return msg.innerText = "⚠️ All fields required!";
                }
                const nameRegex = /^[a-zA-Z\\s]+$/;
                if(!nameRegex.test(name)) return msg.innerText = "⚠️ Invalid Name Layout!";
                if(isNaN(roll)) return msg.innerText = "⚠️ Roll Number must be digits!";

                const marksArr = [Number(java), Number(rProg), Number(os), Number(coa), Number(unix)];
                if(marksArr.some(m => m < 0 || m > 100)) return msg.innerText = "⚠️ Marks Range 0-100!";

                let data = {
                    token: currentActiveToken, name, roll, dob,
                    marks: { "Java": marksArr[0], "R Programming": marksArr[1], "Operating Systems": marksArr[2], "COA": marksArr[3], "Unix/Linux": marksArr[4] }
                };
                
                let res = await fetch('/api/add-result', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
                let resData = await res.json();
                if(resData.error) { msg.innerText = "❌ " + resData.error; } 
                else {
                    msg.innerText = resData.message; msg.style.color = "#4ade80";
                    setTimeout(() => { document.querySelectorAll('#teacher-card input').forEach(i => i.value=""); msg.innerText = ""; }, 2000);
                }
            }
        </script>
    </body>
    </html>
    `);
});

app.post("/api/get-result", async (req, res) => {
    const { roll, dob } = req.body;
    try {
        let student = await Student.findOne({ roll, dob });
        if (student) res.json(student);
        else res.status(404).json({ error: "Invalid Student Details!" });
    } catch (err) { res.status(500).json({ error: "Cloud Server Error" }); }
});

app.post("/api/add-result", async (req, res) => {
    const { token, name, roll, dob, marks } = req.body;
    if(token !== TEACHER_PASSWORD) return res.status(403).json({ error: "Access Denied!" });
    
    let marksValues = Object.values(marks);
    let total = marksValues.reduce((a, b) => a + b, 0);
    let cgpa = (total / 50).toFixed(2);
    let status = cgpa >= 4.0 ? "PASS" : "FAIL";
    
    try {
        await Student.findOneAndUpdate({ roll }, { roll, dob, name, marks, cgpa, status }, { upsert: true });
        res.json({ message: "✅ Published to Cloud Cluster Successfully!" });
    } catch(err) { res.status(500).json({ error: "Database Save Failure!" }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
