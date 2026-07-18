const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// Database Schema for Credentials
const credentialSchema = new mongoose.Schema({
  role: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Purana model exist karta hai toh use use karega, nahi toh naya banayega
const Credential = mongoose.models.Credential || mongoose.model("Credential", credentialSchema);

// HTML settings portal interface
router.get("/admin-settings", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Portal Control Center</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
        body { background-color: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
        .settings-card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 400px; padding: 25px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        h2 { text-align: center; color: #38bdf8; margin-bottom: 20px; font-size: 1.4rem; }
        .form-group { margin-bottom: 15px; }
        label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 6px; }
        select, input { width: 100%; background: #0f172a; border: 1px solid #475569; border-radius: 8px; padding: 10px 14px; color: #f8fafc; }
        select:focus, input:focus { outline: none; border-color: #38bdf8; }
        .btn { width: 100%; padding: 12px; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 10px; background: #4ade80; color: #0f172a; }
        .status-msg { margin-top: 15px; text-align: center; font-size: 0.9rem; font-weight: 600; }
        .success { color: #4ade80; } .error { color: #f87171; }
      </style>
    </head>
    <body>
      <div class="settings-card">
        <h2>🔑 Password Management</h2>
        
        <div class="form-group">
          <label>Select Role</label>
          <select id="userRole">
            <option value="Admin">Admin</option>
            <option value="Teacher">Teacher</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Master Security Token</label>
          <input type="password" id="masterToken" placeholder="Enter master authorization pin">
        </div>
        
        <div class="form-group">
          <label>New Password</label>
          <input type="password" id="newPassword" placeholder="Enter new password">
        </div>
        
        <button class="btn" onclick="updatePortalPassword()">Apply Password Change</button>
        <div id="statusUpdate" class="status-msg"></div>
      </div>

      <script>
        async function updatePortalPassword() {
          const role = document.getElementById('userRole').value;
          const token = document.getElementById('masterToken').value;
          const password = document.getElementById('newPassword').value;
          const status = document.getElementById('statusUpdate');

          if(!token || !password) {
            status.innerHTML = "<span class='error'>❌ Fill all fields!</span>"; return;
          }

          status.innerHTML = "⏳ Updating Cloud Database...";

          try {
            const res = await fetch('/api/update-portal-password', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ role, token, password })
            });
            const out = await res.json();
            
            if(out.success) {
              status.innerHTML = "<span class='success'>✓ " + role + " Password Changed Successfully!</span>";
              document.getElementById('masterToken').value = '';
              document.getElementById('newPassword').value = '';
            } else {
              status.innerHTML = "<span class='error'>❌ " + out.message + "</span>";
            }
          } catch(err) {
            status.innerHTML = "<span class='error'>❌ Connection Error!</span>";
          }
        }
      </script>
    </body>
    </html>
  `);
});

// API endpoint to change password
router.post("/api/update-portal-password", async (req, res) => {
  try {
    const { role, token, password } = req.body;
    
    // Security layer to prevent unauthorized access
    if (token !== "sumit_master_2026") {
      return res.status(401).json({ success: false, message: "Invalid Master Security Token!" });
    }

    await Credential.findOneAndUpdate(
      { role: role },
      { password: password },
      { upsert: true }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
