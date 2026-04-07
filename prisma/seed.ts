import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { addDays, subDays } from "date-fns";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  console.log("🌱 Seed en cours...");

  // USERS
  const password = await bcrypt.hash("Admin1234!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "contact@froidfrance.fr" },
    update: {},
    create: {
      firstName: "Froid",
      lastName: "France",
      email: "contact@froidfrance.fr",
      passwordHash: password,
      role: UserRole.ADMIN,
    },
  });

  // CLIENTS
  const clients = await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      prisma.client.create({
        data: {
          firstName: `Client${i + 1}`,
          lastName: "Test",
          phone: "0600000000",
          email: `client${i + 1}@mail.com`,
          city: "Bourg-en-Bresse",
        },
      }),
    ),
  );

  // CONTRATS avec dates variées
  const contracts = [];

  for (let i = 0; i < 20; i++) {
    let nextDate;

    if (i < 5) {
      // retard
      nextDate = subDays(new Date(), i + 2);
    } else if (i < 10) {
      // J-7
      nextDate = addDays(new Date(), 7);
    } else if (i < 15) {
      // J-30
      nextDate = addDays(new Date(), 30);
    } else {
      // OK
      nextDate = addDays(new Date(), 60);
    }

    const contract = await prisma.contract.create({
      data: {
        clientId: clients[i % clients.length].id,
        equipmentType: "Pompe à chaleur",
        brand: "Daikin",
        model: `Model-${i}`,
        nextMaintenanceDate: nextDate,
        frequencyMonths: 12,
        status: "ACTIVE",
      },
    });

    contracts.push(contract);
  }

  console.log("✅ Seed terminé avec données réalistes");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
