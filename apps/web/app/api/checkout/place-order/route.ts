import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "db";
import { authOptions } from "../../auth/[...nextauth]/route";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { success: false, message: "Please login first." },
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

  const body = (await req.json()) as { addressId?: string, paymentMethod?: string };

  if (!body.addressId) {
    return NextResponse.json(
      { success: false, message: "addressId is required" },
      { status: 400 }
    );
  }

  const paymentMethod = body.paymentMethod || "COD"; // default to COD

  const address = await prisma.address.findFirst({
    where: { id: body.addressId, userId: user.id },
    select: {
      id: true,
      fullName: true,
      phone: true,
      line1: true,
      line2: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
    },
  });

  if (!address) {
    return NextResponse.json(
      { success: false, message: "Address not found" },
      { status: 404 }
    );
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json(
      { success: false, message: "Your cart is empty" },
      { status: 400 }
    );
  }

  for (const item of cart.items) {
    if (item.product.stock < item.quantity) {
      return NextResponse.json(
        {
          success: false,
          message: `${item.product.name} has only ${item.product.stock} items left in stock`,
        },
        { status: 400 }
      );
    }
  }

  const totalAmount = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const createdOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId: user.id,
        totalAmount,
        status: "PLACED",
        paymentStatus: "PENDING",
        shippingName: address.fullName,
        shippingPhone: address.phone,
        shippingLine1: address.line1,
        shippingLine2: address.line2,
        shippingCity: address.city,
        shippingState: address.state,
        shippingPostalCode: address.postalCode,
        shippingCountry: address.country,
      },
    });

    await tx.orderItem.createMany({
      data: cart.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.product.price),
      })),
    });

    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    await tx.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return order;
  });

  if (paymentMethod !== "COD") {
    // Initialize razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy_key",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_test_dummy_secret",
    });

    try {
      const paymentOptions = {
        amount: Math.round(totalAmount * 100), // amount in lowest denomination (paise)
        currency: "INR",
        receipt: createdOrder.id,
      };

      const razorpayOrder = await razorpay.orders.create(paymentOptions);

      return NextResponse.json(
        {
          success: true,
          message: "Razorpay order created",
          data: {
            orderId: createdOrder.id,
            razorpayOrderId: razorpayOrder.id,
            amount: paymentOptions.amount,
            currency: paymentOptions.currency,
          },
        },
        { status: 201 }
      );
    } catch (e) {
      console.error(e);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create Razorpay order",
          data: { orderId: createdOrder.id }
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    {
      success: true,
      message: "Order placed successfully for COD",
      data: { orderId: createdOrder.id },
    },
    { status: 201 }
  );
}
