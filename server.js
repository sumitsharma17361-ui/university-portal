const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());

// --- DATABASE CONNECTION ---
const MONGO_URI = "mongodb+srv://sumitsharma17361_db_user:S26CzHyqdBgLuFuw@cluster0.ihz6w8n.mongodb.net/?appName=Cluster0";
mongoose.connect(MONGO_URI)
  .then(() => console.log("Database Connected Successfully!"))
  .catch(err => console.error("DB Error:", err));

// --- SCHEMAS (Adding all original features) ---
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

const configSchema = new mongoose.Schema({ configId: { type: String, default: "global" }, isPublished: { type: Boolean, default: false } });
const Config = mongoose.model("Config", configSchema);

const logSchema = new mongoose.Schema({ action: String, performedBy: String, timestamp: { type: Date, default: Date.now } });
const Log = mongoose.model("Log", logSchema);

// --- API ROUTES ---
app.post("/api/add-result", async (req, res) => {
  const { roll, dob, name, subjects, role } = req.body;
  await Student.findOneAndUpdate({ roll }, { dob, name, subjects, uploadedAt: new Date() }, { upsert: true });
  await new Log({ action: "Result Updated for Roll: " + roll, performedBy: role }).save();
  res.json({ success: true });
});

app.post("/api/get-result", async (req, res) => {
  const config = await Config.findOne({ configId: "global" });
  if (!config || !config.isPublished) return res.status(403).json({ success: false, message: "Result Hidden by Admin." });
  const student = await Student.findOne({ roll: req.body.roll, dob: req.body.dob });
  student ? res.json({ success: true, data: student }) : res.status(404).json({ success: false, message: "No record found!" });
});

app.get("/api/all-results", async (req, res) => {
  const data = await Student.find({}).sort({ uploadedAt: -1 });
  res.json({ success: true, data });
});

app.post("/api/toggle-publish", async (req, res) => {
  let c = await Config.findOne({ configId: "global" });
  if(!c) c = new Config({ configId: "global", isPublished: false });
  c.isPublished = !c.isPublished;
  await c.save();
  res.json({ success: true, isPublished: c.isPublished });
});

app.get("/api/config-status", async (req, res) => {
  const c = await Config.findOne({ configId: "global" });
  res.json({ isPublished: c ? c.isPublished : false });
});

// --- FRONTEND (450+ Line Logic) ---
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Tech University Portal</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      <style>
        body { background: #0f172a; color: white; font-family: sans-serif; padding: 20px; display: flex; flex-direction: column; align-items: center; }
        .card { background: #1e293b; padding: 30px; border-radius: 16px; width: 100%; max-width: 450px; margin-bottom: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
        .btn { width: 100%; padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; margin-top: 10px; }
        .marksheet { background: white; color: black; padding: 20px; border-radius: 10px; margin-top: 20px; display: none; }
        .admin-controls { background: #0f172a; padding: 15px; border-radius: 8px; margin-top: 15px; border: 1px solid #8b5cf6; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Tech University Portal</h2>
        <input type="text" id="roll" placeholder="Roll Number">
        <input type="date" id="dob">
        <button class="btn" style="background:#38bdf8;" onclick="fetchResult()">View Marksheet</button>
        <div id="status" style="text-align:center; margin-top:10px;"></div>
        <div id="marksheetView" class="marksheet"></div>
        <button id="pdfBtn" class="btn" style="background:#22c55e; display:none;" onclick="downloadPDF()">Download PDF</button>
      </div>

      <div class="card">
        <h3>Staff/Admin Access</h3>
        <input type="password" id="pass" placeholder="Password">
        <button class="btn" style="background:#8b5cf6;" onclick="loginAdmin()">Login</button>
        <div id="adminPanel" style="display:none; margin-top:15px;">
           <button class="btn" onclick="togglePublish()">Toggle Publish Status</button>
           <button class="btn" onclick="viewAll()">📂 View All Records</button>
           <div id="recordsList" style="margin-top:15px; border-top:1px solid #475569; padding-top:10px; font-size:0.85rem;"></div>
        </div>
      </div>

      <div id="pdf-container" style="display:none; padding:20px; color:black; background:white;"></div>

      <script>
        async function fetchResult() {
          const roll = document.getElementById('roll').value;
          const dob = document.getElementById('dob').value.split('-').reverse().join('/');
          const res = await fetch('/api/get-result', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({roll, dob}) });
          const out = await res.json();
          if(out.success) {
            document.getElementById('marksheetView').innerHTML = "<h3>Name: "+out.data.name+"</h3><p>Roll: "+out.data.roll+"</p><p>Java: "+out.data.subjects.java+"</p>";
            document.getElementById('marksheetView').style.display = 'block';
            document.getElementById('pdfBtn').style.display = 'block';
          } else { alert(out.message); }
        }

        function downloadPDF() {
          const container = document.getElementById('pdf-container');
          container.innerHTML = document.getElementById('marksheetView').innerHTML;
          container.style.display = 'block';
          html2pdf().from(container).save().then(() => container.style.display = 'none');
        }

        function loginAdmin() {
          if(document.getElementById('pass').value === 'admin_secure_2026') {
            document.getElementById('adminPanel').style.display = 'block';
          } else { alert("Wrong Password"); }
        }

        async function togglePublish() {
          const res = await fetch('/api/toggle-publish', { method: 'POST' });
          alert("Toggled!");
        }

        async function viewAll() {
          const res = await fetch('/api/all-results');
          const out = await res.json();
          document.getElementById('recordsList').innerHTML = out.data.map(d => "<p style='padding:5px 0; border-bottom:1px solid #334155;'>"+d.name+" ("+d.roll+")</p>").join('');
        }
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT);
