import { NextResponse } from "next/server";
import { prisma } from "db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId, // internal order id
    } = await req.json();

    const secret = process.env.RAZORPAY_KEY_SECRET || "rzp_test_dummy_secret";

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      // Payment successful, update internal order state
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: "PAID" },
        });

        // Upsert payment tracking
        await tx.payment.upsert({
          where: { orderId },
          update: {
            transactionId: razorpay_payment_id,
            status: "PAID",
          },
          create: {
            orderId,
            provider: "RAZORPAY",
            amount: 0, // usually fetched properly but just storing state here
            status: "PAID",
            transactionId: razorpay_payment_id,
          },
        });
      });

      return NextResponse.json({ success: true, message: "Payment verified successfully" });
    } else {
      return NextResponse.json({ success: false, message: "Invalid payment signature" }, { status: 400 });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
