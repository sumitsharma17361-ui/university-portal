const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// 📊 FULL DETAILED RECORDS PUBLIC DISPLAY ENGINE
router.get("/view-student-results", async (req, res) => {
  try {
    const StudentModel = mongoose.model("Student");
    const allStudents = await StudentModel.find({}).sort({ roll: 1 });

    let rowsHtml = "";
    if (allStudents.length === 0) {
      rowsHtml = `<tr><td colspan="5" style="text-align:center; color:#94a3b8;">No records verified in Cloud Cluster.</td></tr>`;
    } else {
      allStudents.forEach(d => {
        const sub = d.subjects || { java: 0, rProg: 0, os: 0, coa: 0, unixLinux: 0 };
        const total = sub.java + sub.rProg + sub.os + sub.coa + sub.unixLinux;
        const pct = ((total / 500) * 100).toFixed(2);
        const statusClass = total >= 165 ? "pass-status" : "fail-status";
        const statusTxt = total >= 165 ? "PASSED" : "BACKLOG";

        rowsHtml += `
          <tr>
            <td><b>${d.roll}</b></td>
            <td>
              <div style="font-weight:600; color:#f8fafc;">${d.name}</div>
              <div style="font-size:0.75rem; color:#64748b;">📅 DOB: ${d.dob}</div>
            </td>
            <td>
              <div class="marks-grid">
                <span>Java: <b>${sub.java}</b></span>
                <span>R: <b>${sub.rProg}</b></span>
                <span>OS: <b>${sub.os}</b></span>
                <span>COA: <b>${sub.coa}</b></span>
                <span>Unix: <b>${sub.unixLinux}</b></span>
              </div>
            </td>
            <td><span style="color:#38bdf8; font-weight:bold;">${total}/500</span> <br><small style="color:#94a3b8;">(${pct}%)</small></td>
            <td><span class="status-badge ${statusClass}">${statusTxt}</span></td>
          </tr>
        `;
      });
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SITM Central Marks Ledger</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
          body { background-color: #0f172a; color: #f8fafc; padding: 30px 15px; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
          .container { width: 100%; max-width: 900px; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
          h2 { color: #38bdf8; font-size: 1.6rem; text-align: center; margin-bottom: 5px; }
          .sub-title { text-align: center; color: #94a3b8; font-size: 0.85rem; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px; }
          .table-wrapper { overflow-x: auto; width: 100%; border-radius: 8px; border: 1px solid #334155; }
          table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
          th { background-color: #0f172a; color: #38bdf8; font-weight: 600; padding: 14px; border-bottom: 2px solid #334155; }
          td { padding: 14px; border-bottom: 1px solid #334155; color: #cbd5e1; vertical-align: middle; }
          tr:hover { background-color: #24334d; }
          .marks-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; font-size: 0.8rem; background: #0f172a; padding: 8px; border-radius: 6px; border: 1px solid #334155; }
          .marks-grid span { color: #94a3b8; }
          .marks-grid b { color: #f8fafc; }
          .status-badge { padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; display: inline-block; }
          .pass-status { background: rgba(74, 222, 128, 0.15); color: #4ade80; border: 1px solid #4ade80; }
          .fail-status { background: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid #f87171; }
          .back-btn { margin-top: 20px; background: #475569; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; text-decoration: none; font-size: 0.85rem; font-weight: 600; transition: background 0.2s; }
          .back-btn:hover { background: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>📊 SITM Central Database Ledger</h2>
          <div class="sub-title">B.Tech Computer Science & Engineering</div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style="width: 10%;">Roll</th>
                  <th style="width: 30%;">Student Details</th>
                  <th style="width: 35%;">Subject Breakdown (100)</th>
                  <th style="width: 13%;">Aggregate</th>
                  <th style="width: 12%;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>
        <a href="/" class="back-btn">← Return to Main Portal</a>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send("Database extraction stream error: " + error.message);
  }
});

module.exports = router;
