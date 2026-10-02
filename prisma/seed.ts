// Optional demo seed: run `npm run db:seed -- --demo` to insert 10 demo rows.
// Without --demo it does nothing (safe against accidental runs).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO = [
  { testerName: "Alex", category: "comment", module: "Device Pairing", message: "Pairing my first switch took under a minute. Very smooth.", status: "reviewed" },
  { testerName: "Priya", category: "pain_point", module: "Home, Room & Family Members", message: "Inviting a family member was confusing — I could not tell whether the invite was sent.", status: "new" },
  { testerName: "Jonas", category: "bug", module: "Device Control (Switches & Dimmers)", message: "Dimmer slider jumps back to 100% when I drag it slowly on Android 14.", status: "new" },
  { testerName: "Maria", category: "improvement", module: "Automations & Schedules", message: "Please let me copy a schedule from one room to another instead of recreating it.", status: "new" },
  { testerName: "Sam", category: "comment", module: "Geofencing", message: "Geofence arrival trigger worked every time during my commute test.", status: "resolved" },
  { testerName: "Lena", category: "bug", module: "BLE Fallback & Offline", message: "When Wi-Fi drops, the app shows the device as offline even though BLE control still works.", status: "new" },
  { testerName: "Omar", category: "pain_point", module: "User Authentication & Profile", message: "Login code SMS took almost 3 minutes to arrive. I thought it failed.", status: "reviewed" },
  { testerName: "Nina", category: "improvement", module: "Vacation Mode & Device Health", message: "Device health screen should show battery level history, not just the current value.", status: "new" },
  { testerName: "Tom", category: "comment", module: "MCB Circuit Breaker", message: "The MCB trip notification arrived instantly. Great.", status: "resolved" },
  { testerName: "Aisha", category: "bug", module: "Security & Performance", message: "App freezes for a few seconds when opening the activity log with 200+ entries.", status: "new" },
] as const;

async function main() {
  if (!process.argv.includes("--demo")) {
    console.log("Seed skipped. Run with --demo to insert 10 demo comments: npm run db:seed -- --demo");
    return;
  }
  for (const row of DEMO) {
    await prisma.feedback.create({
      data: {
        testerName: row.testerName,
        category: row.category as never,
        module: row.module,
        message: row.message,
        status: row.status as never,
      },
    });
  }
  console.log(`Inserted ${DEMO.length} demo feedback rows.`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
