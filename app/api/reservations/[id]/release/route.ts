import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await context.params;

    const result = await prisma.$transaction(
      async (tx) => {

        const reservation =
          await tx.reservation.findUnique({
            where: { id },
          });

        if (!reservation) {
          return {
            error: "Reservation not found",
            status: 404,
          };
        }

        // Prevent double release
        if (
          reservation.status !== "PENDING"
        ) {
          return {
            error:
              "Only pending reservations can be released",
            status: 400,
          };
        }

        const inventory =
          await tx.inventory.findFirst({
            where: {
              productId: reservation.productId,
              warehouseId:
                reservation.warehouseId,
            },
          });

        if (!inventory) {
          return {
            error: "Inventory not found",
            status: 404,
          };
        }

        // Release reserved stock
        await tx.inventory.update({
          where: {
            id: inventory.id,
          },
          data: {
            reservedUnits: {
              decrement:
                reservation.quantity,
            },
          },
        });

        // Update reservation
        const releasedReservation =
          await tx.reservation.update({
            where: { id },

            data: {
              status: "RELEASED",
            },
          });

        return releasedReservation;
      }
    );

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
        error: "Failed to release reservation",
      },
      {
        status: 500,
      }
    );
  }
}