"use server";

import { prisma } from "db";
import { revalidatePath } from "next/cache";

export async function addCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  if (!name) return { error: "Name is required" };

  try {
    await prisma.category.create({
      data: { name, slug }
    });
    revalidatePath("/admin");
    revalidatePath("/products");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function addProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const stock = parseInt(formData.get("stock") as string, 10);
  const categoryId = formData.get("categoryId") as string;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  if (!name || !description || isNaN(price) || isNaN(stock) || !categoryId) {
    return { error: "All fields are required" };
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        stock,
        categoryId
      }
    });
    
    // Add default image
    await prisma.productImage.create({
      data: {
        url: "/image.png",
        productId: product.id
      }
    });

    revalidatePath("/admin");
    revalidatePath("/products");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
