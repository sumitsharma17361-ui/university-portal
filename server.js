const express = require("express");
const mongoose = require("mongoose");
const app = express();
app.use(express.json());

const MONGO_URI = "mongodb+srv://sumitsharma17361_db_user:S26CzHyqdBgLuFuw@cluster0.ihz6w8n.mongodb.net/?appName=Cluster0";
mongoose.connect(MONGO_URI).catch(err => console.error(err));

const Student = mongoose.model("Student", new mongoose.Schema({
  roll: String, dob: String, name: String, 
  subjects: { java: Number, rProg: Number, os: Number, coa: Number, unixLinux: Number }
}));
const Config = mongoose.model("Config", new mongoose.Schema({ configId: String, isPublished: Boolean }));

app.post("/api/get-result", async (req, res) => {
  const config = await Config.findOne({ configId: "global" });
  if (!config || !config.isPublished) return res.status(403).json({ success: false, message: "Result Hidden by Admin." });
  const student = await Student.findOne({ roll: req.body.roll, dob: req.body.dob });
  student ? res.json({ success: true, data: student }) : res.status(404).json({ success: false, message: "Record not found!" });
});

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Tech University Portal</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
        body { background: #0f172a; color: white; display: flex; justify-content: center; padding: 40px 20px; min-height: 100vh; }
        .card { background: #1e293b; padding: 40px; border-radius: 24px; width: 100%; max-width: 500px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); border: 1px solid #334155; }
        h2 { color: #38bdf8; font-size: 2rem; margin-bottom: 25px; text-align: center; }
        input { width: 100%; padding: 15px; margin-bottom: 20px; border-radius: 12px; border: 1px solid #475569; background: #0f172a; color: white; font-size: 1rem; }
        .btn { width: 100%; padding: 16px; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 1.1rem; transition: 0.3s; }
        .btn-primary { background: #38bdf8; color: #0f172a; }
        .marksheet { background: white; color: black; padding: 30px; border-radius: 16px; margin-top: 30px; display: none; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Tech University Portal</h2>
        <input type="text" id="roll" placeholder="Enter Roll Number">
        <input type="date" id="dob">
        <button class="btn btn-primary" onclick="fetchResult()">View Marksheet</button>
        <div id="status" style="margin-top:15px; text-align:center;"></div>
        <div id="marksheetView" class="marksheet"></div>
        <button id="pdfBtn" class="btn" style="background:#22c55e; color:white; margin-top:15px; display:none;" onclick="downloadPDF()">Download PDF</button>
      </div>
      <div id="pdf-container" style="display:none; padding: 30px; color: black; font-size: 1.2rem;"></div>

      <script>
        async function fetchResult() {
          const roll = document.getElementById('roll').value;
          const dob = document.getElementById('dob').value.split('-').reverse().join('/');
          const res = await fetch('/api/get-result', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({roll, dob}) });
          const out = await res.json();
          if(out.success) {
            const d = out.data;
            const view = document.getElementById('marksheetView');
            view.innerHTML = "<h3>Student: "+d.name+"</h3><p>Roll No: "+d.roll+"</p><hr><br><p>Java Programming: "+d.subjects.java+"</p><p>OS: "+d.subjects.os+"</p>";
            view.style.display = 'block';
            document.getElementById('pdfBtn').style.display = 'block';
          } else { document.getElementById('status').innerHTML = "<b style='color:#f87171;'>"+out.message+"</b>"; }
        }
        function downloadPDF() {
          const container = document.getElementById('pdf-container');
          container.innerHTML = document.getElementById('marksheetView').innerHTML;
          container.style.display = 'block';
          html2pdf().from(container).save().then(() => container.style.display = 'none');
        }
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT);
