import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { prisma } from "db";
import styles from "../inner.module.css";
import { authOptions } from "../api/auth/[...nextauth]/route";
import WishlistItemActions from "../../components/WishlistItemActions";

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      wishlistItems: {
        include: {
          product: {
            include: {
              images: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const items = user?.wishlistItems ?? [];

  return (
    <>
      <section className={styles.pageHeader}>
        <div className="mandala-bg" style={{ opacity: 0.1 }}></div>
        <h1 className={styles.pageTitle}>My Wishlist</h1>
        <p className={styles.pageSubtitle}>Treasures you saved for later.</p>
      </section>

      <section
        className={styles.pageContent}
        style={{ backgroundColor: "var(--background-color)", minHeight: "50vh" }}
      >
        <div className="pattern2-bg"></div>
        <div className="container">
          {items.length === 0 ? (
            <div className={styles.card} style={{ textAlign: "center" }}>
              <h2 className={styles.cardTitle}>Wishlist is empty</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
                Save products from the catalog and they will appear here.
              </p>
              <Link href="/products" className="btn-primary" style={{ display: "inline-flex" }}>
                Browse Products
              </Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {items.map((item) => (
                <div key={item.id} className={styles.productCard}>
                  <Link href={`/products/${item.product.id}`}>
                    <div
                      className={styles.productImage}
                      style={{
                        backgroundColor: "var(--linen)",
                        backgroundImage: item.product.images[0]
                          ? `url(${item.product.images[0].url})`
                          : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    ></div>
                    <h3 className={styles.productName}>{item.product.name}</h3>
                    <p className={styles.productPrice}>
                      ₹{Number(item.product.price).toLocaleString()}
                    </p>
                  </Link>
                  <WishlistItemActions productId={item.product.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
