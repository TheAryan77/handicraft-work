import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "db";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, message: "Please login first." },
      { status: 401 }
    );
  }

  const { itemId } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, message: "User not found" },
      { status: 404 }
    );
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!cart) {
    return NextResponse.json(
      { success: false, message: "Cart not found" },
      { status: 404 }
    );
  }

  const deleted = await prisma.cartItem.deleteMany({
    where: { id: itemId, cartId: cart.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json(
      { success: false, message: "Cart item not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { success: true, message: "Item removed from cart" },
    { status: 200 }
  );
}
