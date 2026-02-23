import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const username = "admin";
  const password = "Master10";
  const role = "admin";

  const hash = await bcrypt.hash(password, 10);

  await prisma.users.upsert({
    where: { username },
    update: { password_hash: hash, role },
    create: { username, password_hash: hash, role }
  });

  console.log("Admin user ensured.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
