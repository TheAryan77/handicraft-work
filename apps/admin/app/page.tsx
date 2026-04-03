"use client";

import { useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  category?: { id: string; name: string };
  images: Array<{ id: string; url: string }>;
};

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: { id: string; name: string };
};

type Order = {
  id: string;
  status:
    | "PLACED"
    | "CONFIRMED"
    | "PACKED"
    | "SHIPPED"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  totalAmount: number;
  createdAt: string;
  user: { id: string; name: string; email: string };
  items: OrderItem[];
};

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

type Tab = "products" | "orders";

const ORDER_STATUS_VALUES: Order["status"][] = [
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

function getAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export default function Page() {
  const [token, setToken] = useState<string>("");
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [editingProductId, setEditingProductId] = useState<string>("");
  const [search, setSearch] = useState("");

  const [newProduct, setNewProduct] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
  });
  const [newProductImages, setNewProductImages] = useState<FileList | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "" });

  const [editProduct, setEditProduct] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
  });
  const [editProductImages, setEditProductImages] = useState<FileList | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("admin_token");
    if (saved) {
      setToken(saved);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    void loadAll(token);
  }, [token]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const query = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query) ||
        (p.category?.name || "").toLowerCase().includes(query)
    );
  }, [products, search]);

  async function apiGet<T>(path: string, authToken?: string): Promise<T> {
    if (!apiBase) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
    }
    const res = await fetch(`${apiBase}${path}`, {
      headers: authToken ? getAuthHeaders(authToken) : undefined,
      cache: "no-store",
    });
    const body = (await res.json()) as ApiSuccess<T> | { message?: string };
    if (!res.ok || !("success" in body && body.success)) {
      throw new Error((body as { message?: string }).message || "Request failed");
    }
    return body.data;
  }

  async function apiPatch<T>(path: string, payload: unknown, authToken: string): Promise<T> {
    if (!apiBase) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
    }
    const res = await fetch(`${apiBase}${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(authToken),
      },
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as ApiSuccess<T> | { message?: string };
    if (!res.ok || !("success" in body && body.success)) {
      throw new Error((body as { message?: string }).message || "Request failed");
    }
    return body.data;
  }

  async function apiPost<T>(path: string, payload: unknown, authToken: string): Promise<T> {
    if (!apiBase) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
    }
    const res = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(authToken),
      },
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as ApiSuccess<T> | { message?: string };
    if (!res.ok || !("success" in body && body.success)) {
      throw new Error((body as { message?: string }).message || "Request failed");
    }
    return body.data;
  }

  async function apiPostForm<T>(path: string, form: FormData, authToken: string, method = "POST") {
    if (!apiBase) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
    }
    const res = await fetch(`${apiBase}${path}`, {
      method,
      headers: getAuthHeaders(authToken),
      body: form,
    });
    const body = (await res.json()) as ApiSuccess<T> | { message?: string };
    if (!res.ok || !("success" in body && body.success)) {
      throw new Error((body as { message?: string }).message || "Request failed");
    }
    return body.data;
  }

  async function loadAll(authToken: string) {
    try {
      setLoading(true);
      setNotice("Loading admin data...");
      const [productsData, ordersData, categoriesData] = await Promise.all([
        apiGet<Product[]>("/admin/products?limit=200", authToken),
        apiGet<Order[]>("/admin/orders?limit=200", authToken),
        apiGet<Category[]>("/categories?limit=200"),
      ]);
      setProducts(productsData);
      setOrders(ordersData);
      setCategories(categoriesData);
      setNotice("Admin data loaded");
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    try {
      if (!apiBase) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
      }
      setLoading(true);
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await res.json()) as
        | ApiSuccess<{
            user: { role: string };
            accessToken: string;
          }>
        | { message?: string };

      if (!res.ok || !("success" in body && body.success)) {
        throw new Error((body as { message?: string }).message || "Login failed");
      }

      if (body.data.user.role !== "ADMIN") {
        throw new Error("Only ADMIN users can access this panel");
      }

      window.localStorage.setItem("admin_token", body.data.accessToken);
      setToken(body.data.accessToken);
      setNotice("Logged in as admin");
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function createProduct() {
    try {
      if (!token) return;
      const form = new FormData();
      form.append("name", newProduct.name);
      form.append("slug", newProduct.slug);
      form.append("description", newProduct.description);
      form.append("price", newProduct.price);
      form.append("stock", newProduct.stock);
      form.append("categoryId", newProduct.categoryId);
      if (newProductImages) {
        Array.from(newProductImages).forEach((file) => form.append("images", file));
      }

      await apiPostForm("/admin/products", form, token, "POST");
      setNewProduct({ name: "", slug: "", description: "", price: "", stock: "", categoryId: "" });
      setNewProductImages(null);
      await loadAll(token);
      setNotice("Product created");
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  async function createCategory() {
    try {
      if (!token) return;
      if (!newCategory.name.trim() || !newCategory.slug.trim()) {
        throw new Error("Category name and slug are required");
      }

      await apiPost<Category>(
        "/categories",
        {
          name: newCategory.name.trim(),
          slug: newCategory.slug.trim(),
        },
        token
      );

      setNewCategory({ name: "", slug: "" });
      await loadAll(token);
      setNotice("Category created");
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  function startEdit(product: Product) {
    setEditingProductId(product.id);
    setEditProduct({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      categoryId: product.categoryId,
    });
    setEditProductImages(null);
  }

  async function saveEdit(productId: string) {
    try {
      if (!token) return;
      const form = new FormData();
      form.append("name", editProduct.name);
      form.append("slug", editProduct.slug);
      form.append("description", editProduct.description);
      form.append("price", editProduct.price);
      form.append("stock", editProduct.stock);
      form.append("categoryId", editProduct.categoryId);

      if (editProductImages) {
        Array.from(editProductImages).forEach((file) => form.append("images", file));
      }

      await apiPostForm(`/admin/products/${productId}`, form, token, "PATCH");
      setEditingProductId("");
      setEditProductImages(null);
      await loadAll(token);
      setNotice("Product updated");
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  async function updateStock(productId: string, stock: number) {
    try {
      if (!token) return;
      await apiPatch(`/admin/products/${productId}/stock`, { stock }, token);
      await loadAll(token);
      setNotice("Stock updated");
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  async function updateOrderStatus(orderId: string, status: Order["status"]) {
    try {
      if (!token) return;
      await apiPatch(`/admin/orders/${orderId}/status`, { status }, token);
      await loadAll(token);
      setNotice(`Order ${orderId} status updated to ${status}`);
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  function logout() {
    window.localStorage.removeItem("admin_token");
    setToken("");
    setProducts([]);
    setOrders([]);
    setNotice("Logged out");
  }

  if (!token) {
    return (
      <main>
        <div className="container">
          <div className="card" style={{ maxWidth: 460, margin: "80px auto", padding: 20 }}>
            <h1 style={{ marginBottom: 8 }}>SN HandCrafts Admin</h1>
            <p style={{ marginBottom: 14, color: "var(--muted)" }}>
              Login as ADMIN to manage products, images, stock and orders.
            </p>
            <div className="row" style={{ flexDirection: "column" }}>
              <input
                type="email"
                placeholder="Admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button className="btn-primary" onClick={login} disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
            {notice ? <div className="banner" style={{ marginTop: 12 }}>{notice}</div> : null}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="container">
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1>Admin Panel</h1>
              <p style={{ margin: 0, color: "var(--muted)" }}>
                Add/edit products, upload images, update stock, manage orders and status.
              </p>
            </div>
            <div className="row">
              <button
                className={activeTab === "products" ? "btn-primary" : "btn-secondary"}
                onClick={() => setActiveTab("products")}
              >
                Products
              </button>
              <button
                className={activeTab === "orders" ? "btn-primary" : "btn-secondary"}
                onClick={() => setActiveTab("orders")}
              >
                Orders
              </button>
              <button className="btn-secondary" onClick={logout}>Logout</button>
            </div>
          </div>
          {notice ? <div className="banner" style={{ marginTop: 12 }}>{notice}</div> : null}
        </div>

        {activeTab === "products" ? (
          <>
            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
              <h2 style={{ marginBottom: 12 }}>Create Category</h2>
              <div className="row">
                <input
                  placeholder="Category name"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
                <input
                  placeholder="Category slug"
                  value={newCategory.slug}
                  onChange={(e) =>
                    setNewCategory((prev) => ({ ...prev, slug: e.target.value }))
                  }
                />
                <button className="btn-accent" onClick={createCategory}>
                  Create Category
                </button>
              </div>
            </div>

            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
              <h2 style={{ marginBottom: 12 }}>Add Product</h2>
              <div className="row">
                <input
                  placeholder="Name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                />
                <input
                  placeholder="Slug"
                  value={newProduct.slug}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, slug: e.target.value }))}
                />
                <input
                  placeholder="Price"
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
                />
                <input
                  placeholder="Stock"
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: e.target.value }))}
                />
                <select
                  value={newProduct.categoryId}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, categoryId: e.target.value }))}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="row" style={{ marginTop: 12 }}>
                <textarea
                  placeholder="Description"
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct((prev) => ({ ...prev, description: e.target.value }))
                  }
                  style={{ width: "100%" }}
                />
              </div>
              <div className="row" style={{ marginTop: 12, alignItems: "center" }}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setNewProductImages(e.target.files)}
                />
                <button className="btn-accent" onClick={createProduct}>Create Product</button>
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
                <h2>Manage Products</h2>
                <input
                  placeholder="Search products"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Images</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <strong>{product.name}</strong>
                          <div style={{ color: "var(--muted)", fontSize: 12 }}>{product.slug}</div>
                        </td>
                        <td>{product.category?.name || "-"}</td>
                        <td>INR {product.price.toFixed(2)}</td>
                        <td>
                          <span className="chip">{product.stock}</span>
                        </td>
                        <td>{product.images.length}</td>
                        <td>
                          <div className="row">
                            <button className="btn-secondary" onClick={() => startEdit(product)}>
                              Edit
                            </button>
                            <button
                              className="btn-accent"
                              onClick={() => {
                                const val = window.prompt("Enter new stock", String(product.stock));
                                if (val === null) return;
                                const stock = Number(val);
                                if (!Number.isInteger(stock) || stock < 0) {
                                  setNotice("Stock must be a non-negative integer");
                                  return;
                                }
                                void updateStock(product.id, stock);
                              }}
                            >
                              Update Stock
                            </button>
                          </div>
                          {editingProductId === product.id ? (
                            <div className="card" style={{ marginTop: 10, padding: 10 }}>
                              <div className="row">
                                <input
                                  placeholder="Name"
                                  value={editProduct.name}
                                  onChange={(e) =>
                                    setEditProduct((prev) => ({ ...prev, name: e.target.value }))
                                  }
                                />
                                <input
                                  placeholder="Slug"
                                  value={editProduct.slug}
                                  onChange={(e) =>
                                    setEditProduct((prev) => ({ ...prev, slug: e.target.value }))
                                  }
                                />
                                <input
                                  type="number"
                                  placeholder="Price"
                                  value={editProduct.price}
                                  onChange={(e) =>
                                    setEditProduct((prev) => ({ ...prev, price: e.target.value }))
                                  }
                                />
                                <input
                                  type="number"
                                  placeholder="Stock"
                                  value={editProduct.stock}
                                  onChange={(e) =>
                                    setEditProduct((prev) => ({ ...prev, stock: e.target.value }))
                                  }
                                />
                                <select
                                  value={editProduct.categoryId}
                                  onChange={(e) =>
                                    setEditProduct((prev) => ({ ...prev, categoryId: e.target.value }))
                                  }
                                >
                                  <option value="">Select category</option>
                                  {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="row" style={{ marginTop: 10 }}>
                                <textarea
                                  placeholder="Description"
                                  value={editProduct.description}
                                  onChange={(e) =>
                                    setEditProduct((prev) => ({ ...prev, description: e.target.value }))
                                  }
                                  style={{ width: "100%" }}
                                />
                              </div>
                              <div className="row" style={{ marginTop: 10, alignItems: "center" }}>
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={(e) => setEditProductImages(e.target.files)}
                                />
                                <button className="btn-primary" onClick={() => saveEdit(product.id)}>
                                  Save
                                </button>
                                <button className="btn-secondary" onClick={() => setEditingProductId("")}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="card" style={{ padding: 16 }}>
            <h2 style={{ marginBottom: 12 }}>Manage Orders</h2>
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <div>{order.id.slice(0, 10)}...</div>
                        <div style={{ color: "var(--muted)", fontSize: 12 }}>
                          {new Date(order.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <div>{order.user.name}</div>
                        <div style={{ color: "var(--muted)", fontSize: 12 }}>{order.user.email}</div>
                      </td>
                      <td>INR {order.totalAmount.toFixed(2)}</td>
                      <td>{order.paymentStatus}</td>
                      <td>
                        <span className="chip">{order.status}</span>
                      </td>
                      <td>
                        {order.items.map((item) => (
                          <div key={item.id} style={{ fontSize: 12 }}>
                            {item.product.name} x {item.quantity}
                          </div>
                        ))}
                      </td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            void updateOrderStatus(order.id, e.target.value as Order["status"])
                          }
                        >
                          {ORDER_STATUS_VALUES.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
