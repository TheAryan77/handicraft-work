import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "db";
import styles from "../../../inner.module.css";
import { authOptions } from "../../../api/auth/[...nextauth]/route";

const orderStages = [
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

function pretty(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (s) => s.toUpperCase());
}

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth");
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    redirect("/auth");
  }

  const order = await prisma.order.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true,
            },
          },
        },
      },
      shipment: true,
    },
  });

  if (!order) {
    notFound();
  }

  const stageIndex = orderStages.indexOf(order.status as (typeof orderStages)[number]);

  return (
    <>
      <section className={styles.pageHeader}>
        <div className="mandala-bg" style={{ opacity: 0.1 }}></div>
        <h1 className={styles.pageTitle}>Track Order</h1>
        <p className={styles.pageSubtitle}>Live progress for order #{order.id.slice(0, 8).toUpperCase()}</p>
      </section>

      <section className={styles.pageContent} style={{ backgroundColor: "var(--background-color)" }}>
        <div className="pattern2-bg"></div>
        <div className="container" style={{ display: "grid", gap: "1rem" }}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Shipment Progress</h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {orderStages.map((stage, index) => {
                const done = stageIndex >= index;
                return (
                  <div
                    key={stage}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.7rem",
                      color: done ? "var(--text-primary)" : "var(--text-muted)",
                    }}
                  >
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "999px",
                        background: done ? "var(--terracotta)" : "var(--border)",
                        display: "inline-block",
                      }}
                    ></span>
                    <span style={{ fontWeight: done ? 700 : 500 }}>{pretty(stage)}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.92rem" }}>
              Current status: <strong style={{ color: "var(--text-primary)" }}>{pretty(order.status)}</strong>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.92rem" }}>
              Payment: <strong style={{ color: "var(--text-primary)" }}>{pretty(order.paymentStatus)}</strong>
            </div>
            {order.shipment ? (
              <div style={{ marginTop: "0.6rem", color: "var(--text-muted)", fontSize: "0.92rem" }}>
                Courier: <strong style={{ color: "var(--text-primary)" }}>{order.shipment.courier}</strong> | Tracking ID: <strong style={{ color: "var(--text-primary)" }}>{order.shipment.trackingId}</strong>
              </div>
            ) : (
              <div style={{ marginTop: "0.6rem", color: "var(--text-muted)", fontSize: "0.92rem" }}>
                Shipment details will appear once dispatched.
              </div>
            )}
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Items</h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {order.items.map((item) => (
                <div key={item.id} style={{ display: "flex", gap: "0.7rem", alignItems: "center" }}>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "8px",
                      backgroundColor: "var(--linen)",
                      backgroundImage: item.product.images[0] ? `url(${item.product.images[0].url})` : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                  <div>
                    <p style={{ margin: 0, color: "var(--text-primary)", fontWeight: 600 }}>{item.product.name}</p>
                    <p style={{ margin: "0.2rem 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <Link href={`/orders/${order.id}/invoice`} className="btn-secondary" style={{ display: "inline-flex" }}>
                View Invoice
              </Link>
              <Link href="/orders" className="btn-primary" style={{ display: "inline-flex" }}>
                Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
