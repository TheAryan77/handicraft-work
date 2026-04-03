import { prisma } from "db";
import { ProductsClient } from "./products-client";

export default async function ProductsPage() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });
  const products = await prisma.product.findMany({
    include: { images: true, category: true },
  });

  const safeProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    categoryId: product.categoryId,
    category: product.category
      ? { id: product.category.id, name: product.category.name }
      : undefined,
    images: product.images.map((image) => ({ id: image.id, url: image.url })),
  }));

  return <ProductsClient categories={categories} products={safeProducts} />;
}
