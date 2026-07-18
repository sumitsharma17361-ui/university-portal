const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());

const MONGO_URI = "mongodb+srv://sumitsharma17361_db_user:S26CzHyqdBgLuFuw@cluster0.ihz6w8n.mongodb.net/?appName=Cluster0";
mongoose.connect(MONGO_URI).then(() => console.log("DB Connected")).catch(err => console.error(err));

const studentSchema = new mongoose.Schema({
  roll: { type: String, required: true, unique: true },
  dob: String, name: String, course: { type: String, default: "B.Tech CSE" },
  subjects: { java: Number, rProg: Number, os: Number, coa: Number, unixLinux: Number },
  uploadedAt: { type: Date, default: Date.now }
});
const Student = mongoose.model("Student", studentSchema);
const Config = mongoose.model("Config", new mongoose.Schema({ configId: String, isPublished: Boolean }));

app.post("/api/add-result", async (req, res) => {
  const { roll, dob, name, subjects } = req.body;
  await Student.findOneAndUpdate({ roll }, { dob, name, subjects, uploadedAt: new Date() }, { upsert: true });
  res.json({ success: true });
});

app.post("/api/get-result", async (req, res) => {
  const config = await Config.findOne({ configId: "global" });
  if (!config || !config.isPublished) return res.status(403).json({ success: false, message: "Result Hidden by Admin." });
  const student = await Student.findOne({ roll: req.body.roll, dob: req.body.dob });
  student ? res.json({ success: true, data: student }) : res.status(404).json({ success: false, message: "Record not found." });
});

app.get("/api/config-status", async (req, res) => {
  const c = await Config.findOne({ configId: "global" });
  res.json({ isPublished: c ? c.isPublished : false });
});

app.post("/api/toggle-publish", async (req, res) => {
  let c = await Config.findOne({ configId: "global" });
  if(!c) c = new Config({ configId: "global", isPublished: false });
  c.isPublished = !c.isPublished;
  await c.save();
  res.json({ success: true, isPublished: c.isPublished });
});

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Modern Tech University Portal</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      <style>
        :root { --primary: #6366f1; --bg: #0f172a; --card: rgba(30, 41, 59, 0.7); }
        body { background: radial-gradient(circle at top right, #1e1b4b, #0f172a); color: white; font-family: 'Inter', sans-serif; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 20px; }
        .glass-card { background: var(--card); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 30px; width: 100%; max-width: 450px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
        h1 { font-size: 1.8rem; margin-bottom: 20px; text-align: center; color: #818cf8; }
        input { width: 100%; background: rgba(0,0,0,0.2); border: 1px solid #334155; border-radius: 10px; padding: 12px; color: white; margin-bottom: 15px; }
        .btn { width: 100%; padding: 12px; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; transition: 0.3s; }
        .btn-primary { background: var(--primary); color: white; }
        .btn-primary:hover { background: #4f46e5; }
        .marksheet { background: white; color: black; padding: 20px; border-radius: 10px; margin-top: 20px; display: none; }
      </style>
    </head>
    <body>
      <div class="glass-card">
        <h1>🎓 Tech University</h1>
        <input type="text" id="roll" placeholder="Roll Number">
        <input type="date" id="dob">
        <button class="btn btn-primary" onclick="fetchResult()">View Marksheet</button>
        <div id="status" style="margin-top:10px; text-align:center;"></div>
        <div id="marksheetView" class="marksheet"></div>
        <button id="pdfBtn" class="btn" style="background:#22c55e; color:white; margin-top:10px; display:none;" onclick="downloadPDF()">Download PDF</button>
      </div>

      <div id="pdf-container" style="display:none; padding: 20px; font-family: sans-serif; color: black;">
         <div id="pdf-content"></div>
      </div>

      <script>
        async function fetchResult() {
          const roll = document.getElementById('roll').value;
          const dob = document.getElementById('dob').value.split('-').reverse().join('/');
          const res = await fetch('/api/get-result', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({roll, dob}) });
          const out = await res.json();
          if(out.success) {
            const d = out.data;
            const view = document.getElementById('marksheetView');
            view.innerHTML = "<h3>"+d.name+"</h3><p>Roll: "+d.roll+"</p><hr><p>Java: "+d.subjects.java+"</p>"; // Simplify as needed
            view.style.display = 'block';
            document.getElementById('pdfBtn').style.display = 'block';
          } else { document.getElementById('status').innerText = out.message; }
        }

        function downloadPDF() {
          const content = document.getElementById('marksheetView').innerHTML;
          const container = document.getElementById('pdf-container');
          document.getElementById('pdf-content').innerHTML = content;
          container.style.display = 'block';
          html2pdf().from(container).save().then(() => container.style.display = 'none');
        }
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Running..."));
