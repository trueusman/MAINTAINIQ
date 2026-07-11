import bcrypt from "bcryptjs";
import { db, pool } from "./index";
import {
  usersTable,
  assetsTable,
  issuesTable,
  maintenanceTable,
  historyTable,
  notificationsTable,
} from "./schema";

async function seed() {
  const existingUsers = await db.select().from(usersTable);
  if (existingUsers.length > 0) {
    console.log("Database already has data, skipping seed.");
    await pool.end();
    return;
  }

  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const techPasswordHash = await bcrypt.hash("tech123", 10);

  const [admin] = await db
    .insert(usersTable)
    .values({
      name: "Dana Reyes",
      email: "admin@maintainiq.app",
      passwordHash: adminPasswordHash,
      role: "admin",
      phone: "555-0100",
    })
    .returning();

  const [tech1] = await db
    .insert(usersTable)
    .values({
      name: "Marcus Bell",
      email: "marcus@maintainiq.app",
      passwordHash: techPasswordHash,
      role: "technician",
      phone: "555-0101",
    })
    .returning();

  const [tech2] = await db
    .insert(usersTable)
    .values({
      name: "Priya Nair",
      email: "priya@maintainiq.app",
      passwordHash: techPasswordHash,
      role: "technician",
      phone: "555-0102",
    })
    .returning();

  if (!admin || !tech1 || !tech2) throw new Error("Failed to seed users");

  const [asset1] = await db
    .insert(assetsTable)
    .values({
      name: "Rooftop AHU-3",
      assetCode: "HVAC-003",
      category: "HVAC",
      location: "Building A - Roof",
      model: "Carrier 48TC",
      manufacturer: "Carrier",
      condition: "good",
      status: "operational",
      assignedTechnicianId: tech1.id,
      lastServiceDate: "2026-05-12",
      nextServiceDate: "2026-11-12",
    })
    .returning();

  const [asset2] = await db
    .insert(assetsTable)
    .values({
      name: "Backup Generator 2",
      assetCode: "GEN-002",
      category: "Power",
      location: "Building B - Basement",
      model: "Cummins C150D6",
      manufacturer: "Cummins",
      condition: "fair",
      status: "under_maintenance",
      assignedTechnicianId: tech2.id,
      lastServiceDate: "2026-06-01",
      nextServiceDate: "2026-09-01",
    })
    .returning();

  const [asset3] = await db
    .insert(assetsTable)
    .values({
      name: "Passenger Elevator 1",
      assetCode: "ELV-001",
      category: "Elevator",
      location: "Building A - Lobby",
      model: "Otis Gen2",
      manufacturer: "Otis",
      condition: "excellent",
      status: "operational",
    })
    .returning();

  if (!asset1 || !asset2 || !asset3) throw new Error("Failed to seed assets");

  const [issue1] = await db
    .insert(issuesTable)
    .values({
      issueNumber: "ISS-SEED-0001",
      assetId: asset2.id,
      reporterName: "Building Security",
      reporterEmail: "security@example.com",
      title: "Generator failed weekly self-test",
      description:
        "The backup generator did not start during the scheduled Tuesday self-test cycle.",
      priority: "high",
      category: "Power",
      status: "maintenance_in_progress",
      assignedTechnicianId: tech2.id,
      aiTitle: "Generator self-test failure",
      aiCategory: "Power",
      aiPriority: "high",
      aiPossibleCauses: [
        "Dead or degraded starter battery",
        "Fuel supply blockage",
        "Faulty transfer switch",
      ],
      aiDiagnosticChecks: [
        "Check starter battery voltage and terminals",
        "Inspect fuel lines and filters",
        "Verify automatic transfer switch signal",
      ],
      aiSafetyNotes:
        "De-energize the transfer switch before inspecting wiring. Follow lockout/tagout procedure.",
    })
    .returning();

  const [issue2] = await db
    .insert(issuesTable)
    .values({
      issueNumber: "ISS-SEED-0002",
      assetId: asset1.id,
      reporterName: "Facilities Front Desk",
      reporterEmail: "frontdesk@example.com",
      title: "Rooftop unit making loud noise",
      description: "Loud rattling noise coming from AHU-3 for the past two days.",
      priority: "medium",
      category: "HVAC",
      status: "resolved",
      assignedTechnicianId: tech1.id,
    })
    .returning();

  if (!issue1 || !issue2) throw new Error("Failed to seed issues");

  await db.insert(maintenanceTable).values({
    issueId: issue1.id,
    technicianId: tech2.id,
    notes: "Replaced starter battery, generator now passes self-test.",
    cost: 245.5,
    replacementParts: ["12V starter battery"],
    timeSpentMinutes: 90,
  });

  await db.insert(maintenanceTable).values({
    issueId: issue2.id,
    technicianId: tech1.id,
    notes: "Tightened loose fan blade mount, noise resolved.",
    cost: 0,
    timeSpentMinutes: 45,
  });

  await db.insert(historyTable).values([
    {
      assetId: asset2.id,
      issueId: issue1.id,
      userName: "Building Security",
      action: "issue_reported",
      status: "reported",
      notes: issue1.title,
    },
    {
      assetId: asset2.id,
      issueId: issue1.id,
      userId: admin.id,
      userName: admin.name,
      action: "issue_assigned",
      status: "assigned",
      notes: `Assigned to ${tech2.name}`,
    },
    {
      assetId: asset1.id,
      issueId: issue2.id,
      userName: "Facilities Front Desk",
      action: "issue_reported",
      status: "reported",
      notes: issue2.title,
    },
    {
      assetId: asset1.id,
      issueId: issue2.id,
      userId: tech1.id,
      userName: tech1.name,
      action: "status_changed",
      status: "resolved",
      notes: "Fixed loose fan blade mount",
    },
  ]);

  await db.insert(notificationsTable).values([
    {
      userId: tech2.id,
      type: "issue_assigned",
      title: "New issue assigned",
      message: `You were assigned to "${issue1.title}"`,
    },
    {
      userId: admin.id,
      type: "issue_resolved",
      title: "Issue resolved",
      message: `"${issue2.title}" was marked resolved`,
      read: true,
    },
  ]);

  console.log("Seed complete.");
  console.log("Admin login: admin@maintainiq.app / admin123");
  console.log("Technician logins: marcus@maintainiq.app / tech123, priya@maintainiq.app / tech123");

  await pool.end();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
