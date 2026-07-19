const express = require("express");
const router = express.Router();

// 📄 MODULE-BASED AUTOMATED PDF GENERATION STREAM
router.post("/api/download-provisional-pdf", (req, res) => {
  try {
    const { name, roll, dob, course, subjects, total, pct } = req.body;

    // Direct automated HTML layout construction for pdf compiling
    const pdfHtml = `
      <div style="padding: 40px; color: #000000; background: #ffffff; font-family: 'Segoe UI', sans-serif;">
        <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 10px; margin-bottom: 20px;">
          <h1 style="font-size: 24px; margin: 0; color: #000000;">SITM COLLEGE</h1>
          <p style="font-size: 12px; margin: 5px 0 0 0; color: #555555;">Provisional Academic Performance Statement</p>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #475569; padding-bottom: 8px; font-weight: bold;">
          <span>NAME: ${name}</span>
          <span>ROLL: ${roll}</span>
        </div>
        <div style="font-size: 14px; color: #555555; margin-bottom: 15px;">COURSE: ${course || 'B.Tech CSE'}</div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><span>Java Programming:</span><b>${subjects.java}</b></div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><span>R Programming:</span><b>${subjects.rProg}</b></div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><span>Operating Systems:</span><b>${subjects.os}</b></div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><span>Computer Org & Arch:</span><b>${subjects.coa}</b></div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><span>Unix / Linux Lab:</span><b>${subjects.unixLinux}</b></div>
        <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 10px; font-weight: bold; font-size: 16px; color: #1e3a8a; border-top: 2px solid #000000;">
          <span>Grand Total:</span>
          <span>${total}/500 (${pct}%)</span>
        </div>
      </div>
    `;

    res.status(200).json({ success: true, htmlContent: pdfHtml });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
