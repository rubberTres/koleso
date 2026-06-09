import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const catalog: Record<string, string[]> = {
  Audi: ["A3", "A4", "A6", "Q5", "RS3", "S4"],
  BMW: ["1 Series", "3 Series", "5 Series", "M3", "M4", "X3"],
  Ford: ["Fiesta", "Focus", "Mondeo", "Mustang"],
  Honda: ["Civic", "Accord", "S2000"],
  Mazda: ["3", "6", "MX-5"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "CLA"],
  Opel: ["Astra", "Corsa", "Insignia"],
  Peugeot: ["208", "308", "508"],
  Porsche: ["911", "Cayman", "Macan"],
  Renault: ["Clio", "Megane"],
  Seat: ["Ibiza", "Leon"],
  Skoda: ["Fabia", "Octavia", "Superb"],
  Subaru: ["Impreza", "WRX", "BRZ"],
  Toyota: ["Corolla", "Yaris", "GR86", "Supra"],
  Volkswagen: ["Golf", "Passat", "Polo", "Scirocco", "Arteon"],
  Volvo: ["S60", "V60", "XC60"],
};

async function main() {
  let makes = 0;
  let models = 0;

  for (const [makeName, modelNames] of Object.entries(catalog)) {
    const make = await prisma.carMake.upsert({
      where: { name: makeName },
      create: { name: makeName },
      update: {},
    });
    makes++;

    for (const modelName of modelNames) {
      await prisma.carModel.upsert({
        where: { makeId_name: { makeId: make.id, name: modelName } },
        create: { makeId: make.id, name: modelName },
        update: {},
      });
      models++;
    }
  }

  console.log(`seeded ${makes} makes, ${models} models`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
