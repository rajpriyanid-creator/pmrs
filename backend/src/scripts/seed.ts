import "../config/env";
import crypto from "node:crypto";
import { connectDatabase, disconnectDatabase } from "../config/db";
import { Admin } from "../models/Admin";
import { Program } from "../models/Program";
import { Config } from "../models/Config";
import { hashPassword } from "../utils/password";
import { logger } from "../config/logger";

/**
 * One-time bootstrap: creates the first Admin account (there is no
 * self-registration path for Admin by design) and a couple of starter
 * Programs. Run with: npm run seed -- --admin-username=admin --admin-email=admin@example.edu
 */
async function main() {
  await connectDatabase();

  const existingAdmin = await Admin.findOne();
  if (existingAdmin) {
    logger.info("An Admin account already exists - skipping admin bootstrap.");
  } else {
    const tempPassword = crypto.randomBytes(12).toString("base64url");
    const passwordHash = await hashPassword(tempPassword);
    await Admin.create({
      name: "System Administrator",
      username: "admin",
      email: "admin@example.edu",
      passwordHash,
      mustChangePassword: true,
    });
    // eslint-disable-next-line no-console
    console.log("\n=== First Admin account created ===");
    console.log("username: admin");
    console.log(`temporary password: ${tempPassword}`);
    console.log("You will be forced to change this password on first login.\n");
  }

  const programCount = await Program.countDocuments();
  if (programCount === 0) {
    await Program.insertMany([
      { name: "Undergraduate Program", type: "UG", code: "UG" },
      { name: "M.E. Computer Science", type: "PG", code: "MECSE" },
    ]);
    logger.info("Seeded starter programs (UG, MECSE).");
  }

  await Config.getSingleton();
  logger.info("Singleton Config document ensured.");

  await disconnectDatabase();
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, "Seed script failed");
  process.exit(1);
});
