import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "db";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, message: "Please login to add items to cart" },
      { status: 401 }
    );
  }

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

  const body = (await req.json()) as { productId?: string; quantity?: number };
  const productId = body.productId;
  const quantity = Math.max(1, Number(body.quantity ?? 1));

  if (!productId) {
    return NextResponse.json(
      { success: false, message: "productId is required" },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json(
      { success: false, message: "Product not found" },
      { status: 404 }
    );
  }

  if (product.stock < quantity) {
    return NextResponse.json(
      { success: false, message: `Only ${product.stock} items in stock` },
      { status: 400 }
    );
  }

  let cart = await prisma.cart.findUnique({ where: { userId: user.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: user.id } });
  }

  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId },
  });

  if (existing) {
    const nextQty = existing.quantity + quantity;
    if (product.stock < nextQty) {
      return NextResponse.json(
        { success: false, message: `Only ${product.stock} items in stock` },
        { status: 400 }
      );
    }

    const updated = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQty },
    });

    return NextResponse.json({ success: true, message: "Item added to cart", data: updated }, { status: 200 });
  }

  const created = await prisma.cartItem.create({
    data: { cartId: cart.id, productId, quantity },
  });

  return NextResponse.json({ success: true, message: "Item added to cart", data: created }, { status: 201 });
}
