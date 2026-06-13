const bcrypt = require("bcryptjs");
const User = require("../models/User");

const seedAdmin = async () => {
  try {
    // Check if superadmin already exists
    const superAdminExists = await User.findOne({ isSuperAdmin: true });

    if (superAdminExists) {
      console.log("✅ SuperAdmin already exists — skipping seed.");
      return;
    }

    const { FIRST_ADMIN_NAME, FIRST_ADMIN_EMAIL, FIRST_ADMIN_PASSWORD } =
      process.env;

    if (!FIRST_ADMIN_NAME || !FIRST_ADMIN_EMAIL || !FIRST_ADMIN_PASSWORD) {
      console.warn(
        "⚠️  No superadmin found and FIRST_ADMIN_* env vars not set. Skipping seed."
      );
      return;
    }

    const passwordHash = await bcrypt.hash(FIRST_ADMIN_PASSWORD, 12);

    await User.create({
      name: FIRST_ADMIN_NAME,
      email: FIRST_ADMIN_EMAIL,
      role: "admin",
      provider: "local",
      passwordHash,
      isActive: true,
      isSuperAdmin: true, // ← only place this is ever set to true
    });

    console.log(`✅ SuperAdmin created: ${FIRST_ADMIN_EMAIL}`);
    console.log(
      "🔐 Please delete FIRST_ADMIN_* vars from .env after first login."
    );
  } catch (error) {
    console.error("❌ SuperAdmin seed failed:", error.message);
  }
};

module.exports = seedAdmin;
