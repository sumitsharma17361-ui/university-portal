const mongoose = require("mongoose");

// Database URI
const MONGO_URI = "mongodb+srv://sumitsharma17361_db_user:S26CzHyqdBgLuFuw@cluster0.ihz6w8n.mongodb.net/?appName=Cluster0";

// Schema definition
const credentialSchema = new mongoose.Schema({
  role: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const Credential = mongoose.model("Credential", credentialSchema);

async function changePasswords() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("⚡ Database connected successfully for Password Update!");

    // 🔑 YAHAN APNA NAYA PASSWORD LIKHO:
    const newAdminPassword = "my_new_admin_pass_2026"; 
    const newTeacherPassword = "my_new_teacher_pass_2026";

    // Update Admin
    await Credential.findOneAndUpdate(
      { role: "Admin" },
      { password: newAdminPassword },
      { upsert: true, new: true }
    );
    console.log("👑 Admin password updated in Cloud Database!");

    // Update Teacher
    await Credential.findOneAndUpdate(
      { role: "Teacher" },
      { password: newTeacherPassword },
      { upsert: true, new: true }
    );
    console.log("🛡️ Teacher password updated in Cloud Database!");

    console.log("✅ All passwords synchronized.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating passwords:", error);
    process.exit(1);
  }
}

changePasswords();
