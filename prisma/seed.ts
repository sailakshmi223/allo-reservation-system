import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create products
  const iphone = await prisma.product.create({
    data: {
      name: "iPhone 15",
    },
  });

  const laptop = await prisma.product.create({
    data: {
      name: "MacBook Air",
    },
  });

  // Create warehouses
  const chennaiWarehouse = await prisma.warehouse.create({
    data: {
      name: "Chennai Warehouse",
    },
  });

  const bangaloreWarehouse = await prisma.warehouse.create({
    data: {
      name: "Bangalore Warehouse",
    },
  });

  // Create inventory
  await prisma.inventory.createMany({
    data: [
      {
        productId: iphone.id,
        warehouseId: chennaiWarehouse.id,
        totalUnits: 10,
        reservedUnits: 0,
      },
      {
        productId: iphone.id,
        warehouseId: bangaloreWarehouse.id,
        totalUnits: 5,
        reservedUnits: 0,
      },
      {
        productId: laptop.id,
        warehouseId: chennaiWarehouse.id,
        totalUnits: 7,
        reservedUnits: 0,
      },
    ],
  });

  console.log("Seed data inserted");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });