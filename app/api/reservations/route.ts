import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      productId,
      warehouseId,
      quantity,
    } = body;

    const result = await prisma.$transaction(
      async (tx) => {

        // Lock inventory row
        const inventoryResult =
          await tx.$queryRawUnsafe<any[]>(`
            SELECT *
            FROM "Inventory"
            WHERE "productId" = '${productId}'
            AND "warehouseId" = '${warehouseId}'
            FOR UPDATE
          `);

        const inventory = inventoryResult[0];

        if (!inventory) {
          throw new Error("Inventory not found");
        }

        const availableUnits =
          inventory.totalUnits -
          inventory.reservedUnits;

        // Return custom error object
        if (availableUnits < quantity) {
          return {
            error: "Not enough stock available",
            status: 409,
          };
        }

        // Increase reserved stock
        await tx.inventory.update({
          where: {
            id: inventory.id,
          },
          data: {
            reservedUnits: {
              increment: quantity,
            },
          },
        });

        // Create reservation
        const reservation =
          await tx.reservation.create({
            data: {
              productId,
              warehouseId,
              quantity,

              status: "PENDING",

              expiresAt: new Date(
                Date.now() + 10 * 60 * 1000
              ),
            },
          });

        return reservation;
      }
    );

    // Handle 409 properly
    if ("error" in result) {
      return NextResponse.json(
        {
          error: result.error,
        },
        {
          status: result.status,
        }
      );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to create reservation",
      },
      {
        status: 500,
      }
    );
  }
}