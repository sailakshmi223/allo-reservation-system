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

        // Already expired
        if (
          reservation.expiresAt < new Date()
        ) {

          // Release reserved units
          const inventory =
            await tx.inventory.findFirst({
              where: {
                productId: reservation.productId,
                warehouseId:
                  reservation.warehouseId,
              },
            });

          if (inventory) {
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
          }

          // Update reservation status
          await tx.reservation.update({
            where: { id },
            data: {
              status: "RELEASED",
            },
          });

          return {
            error: "Reservation expired",
            status: 410,
          };
        }

        // Update inventory permanently
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

        await tx.inventory.update({
          where: {
            id: inventory.id,
          },
          data: {
            totalUnits: {
              decrement:
                reservation.quantity,
            },

            reservedUnits: {
              decrement:
                reservation.quantity,
            },
          },
        });

        // Confirm reservation
        const confirmedReservation =
          await tx.reservation.update({
            where: { id },

            data: {
              status: "CONFIRMED",
            },
          });

        return confirmedReservation;
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
        error: "Failed to confirm reservation",
      },
      {
        status: 500,
      }
    );
  }
}