import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create the first user
  const passwordHash = await bcrypt.hash("Amalio1000!", 12);

  const user = await prisma.user.upsert({
    where: { email: "amalios622@gmail.com" },
    update: {},
    create: {
      email: "amalios622@gmail.com",
      username: "amalio1000",
      passwordHash,
    },
  });

  console.log(`User created: ${user.username} (${user.email})`);

  // Migrate existing PlayerStats singleton to this user
  const existingStats = await prisma.playerStats.findFirst({
    where: { userId: null },
  });

  if (existingStats) {
    await prisma.playerStats.update({
      where: { id: existingStats.id },
      data: { userId: user.id },
    });
    console.log("Migrated existing PlayerStats to user");
  } else {
    console.log("No orphaned PlayerStats found");
  }

  // Migrate existing Sessions to this user
  const updatedSessions = await prisma.session.updateMany({
    where: { userId: null },
    data: { userId: user.id },
  });
  console.log(`Migrated ${updatedSessions.count} sessions to user`);

  console.log("Seed complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
