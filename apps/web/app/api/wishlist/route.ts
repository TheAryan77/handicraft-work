import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "db";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    select: { productId: true },
  });

  return NextResponse.json(
    { success: true, data: items.map((item) => item.productId) },
    { status: 200 }
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, message: "Please login first to manage wishlist." },
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

  const body = (await req.json()) as { productId?: string };

  if (!body.productId) {
    return NextResponse.json(
      { success: false, message: "productId is required" },
      { status: 400 }
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: body.productId },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json(
      { success: false, message: "Product not found" },
      { status: 404 }
    );
  }

  await prisma.wishlistItem.upsert({
    where: {
      userId_productId: {
        userId: user.id,
        productId: body.productId,
      },
    },
    update: {},
    create: {
      userId: user.id,
      productId: body.productId,
    },
  });

  return NextResponse.json(
    { success: true, message: "Added to wishlist" },
    { status: 200 }
  );
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, message: "Please login first to manage wishlist." },
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

  const body = (await req.json()) as { productId?: string };

  if (!body.productId) {
    return NextResponse.json(
      { success: false, message: "productId is required" },
      { status: 400 }
    );
  }

  await prisma.wishlistItem.deleteMany({
    where: {
      userId: user.id,
      productId: body.productId,
    },
  });

  return NextResponse.json(
    { success: true, message: "Removed from wishlist" },
    { status: 200 }
  );
}
