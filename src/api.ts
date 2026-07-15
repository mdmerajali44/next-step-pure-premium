import { Product, Order, Category, SiteConfig, User, WithdrawRequest, ProductRequest } from "./types";

// Dynamic API URL from Vite environment variables (.env / .env.local)
// In production or when hosted together, empty string '' uses relative path, which is best for Render
const API_BASE = (import.meta as any).env?.VITE_API_URL || "";

// Helper for fetch requests
async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errText = await response.text();
    let errJson;
    try {
      errJson = JSON.parse(errText);
    } catch {
      // ignore
    }
    throw new Error(errJson?.error || errText || `HTTP Error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // --- PRODUCTS ---
  getProducts: async (fallback: Product[]): Promise<Product[]> => {
    try {
      return await apiRequest<Product[]>("/api/products");
    } catch (e) {
      console.warn("API getProducts failed, falling back to local:", e);
      const saved = localStorage.getItem("ml_products");
      return saved ? JSON.parse(saved) : fallback;
    }
  },
  createProduct: async (product: Product): Promise<Product> => {
    try {
      return await apiRequest<Product>("/api/products", {
        method: "POST",
        body: JSON.stringify(product),
      });
    } catch (e) {
      console.warn("API createProduct failed, falling back to local:", e);
      return product;
    }
  },
  updateProduct: async (product: Product): Promise<Product> => {
    try {
      return await apiRequest<Product>(`/api/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify(product),
      });
    } catch (e) {
      console.warn("API updateProduct failed, falling back to local:", e);
      return product;
    }
  },
  deleteProduct: async (id: string): Promise<boolean> => {
    try {
      await apiRequest<{ success: boolean }>(`/api/products/${id}`, {
        method: "DELETE",
      });
      return true;
    } catch (e) {
      console.warn("API deleteProduct failed:", e);
      return false;
    }
  },

  // --- CATEGORIES ---
  getCategories: async (fallback: Category[]): Promise<Category[]> => {
    try {
      return await apiRequest<Category[]>("/api/categories");
    } catch (e) {
      console.warn("API getCategories failed, falling back to local:", e);
      const saved = localStorage.getItem("ml_categories");
      return saved ? JSON.parse(saved) : fallback;
    }
  },
  createCategory: async (category: Category): Promise<Category> => {
    try {
      return await apiRequest<Category>("/api/categories", {
        method: "POST",
        body: JSON.stringify(category),
      });
    } catch (e) {
      console.warn("API createCategory failed:", e);
      return category;
    }
  },
  updateCategory: async (category: Category): Promise<Category> => {
    try {
      return await apiRequest<Category>(`/api/categories/${category.id}`, {
        method: "PUT",
        body: JSON.stringify(category),
      });
    } catch (e) {
      console.warn("API updateCategory failed:", e);
      return category;
    }
  },
  deleteCategory: async (id: string): Promise<boolean> => {
    try {
      await apiRequest<{ success: boolean }>(`/api/categories/${id}`, {
        method: "DELETE",
      });
      return true;
    } catch (e) {
      console.warn("API deleteCategory failed:", e);
      return false;
    }
  },

  // --- ORDERS ---
  getOrders: async (fallback: Order[]): Promise<Order[]> => {
    try {
      return await apiRequest<Order[]>("/api/orders");
    } catch (e) {
      console.warn("API getOrders failed, falling back to local:", e);
      const saved = localStorage.getItem("ml_orders");
      return saved ? JSON.parse(saved) : fallback;
    }
  },
  createOrder: async (order: Partial<Order>): Promise<Order> => {
    return await apiRequest<Order>("/api/orders", {
      method: "POST",
      body: JSON.stringify(order),
    });
  },
  updateOrder: async (order: Order): Promise<Order> => {
    try {
      return await apiRequest<Order>(`/api/orders/${order.id}`, {
        method: "PUT",
        body: JSON.stringify(order),
      });
    } catch (e) {
      console.warn("API updateOrder failed:", e);
      return order;
    }
  },
  deleteOrder: async (id: string, phone?: string, role?: string): Promise<boolean> => {
    try {
      const headers: Record<string, string> = {};
      if (phone) headers['x-requester-phone'] = phone;
      if (role) headers['x-requester-role'] = role;

      await apiRequest<{ success: boolean }>(`/api/orders/${id}`, {
        method: "DELETE",
        headers,
      });
      return true;
    } catch (e) {
      console.warn("API deleteOrder failed:", e);
      return false;
    }
  },

  // --- AUTH / USERS ---
  register: async (user: Partial<User>): Promise<User> => {
    const res = await apiRequest<{ success: boolean; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(user),
    });
    return res.user;
  },
  login: async (phone: string, password: string): Promise<User> => {
    const res = await apiRequest<{ success: boolean; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    });
    return res.user;
  },
  getUsers: async (fallback: User[]): Promise<User[]> => {
    try {
      return await apiRequest<User[]>("/api/auth/users");
    } catch (e) {
      console.warn("API getUsers failed, falling back to local:", e);
      const saved = localStorage.getItem("ml_users");
      return saved ? JSON.parse(saved) : fallback;
    }
  },
  updateUser: async (user: User): Promise<User> => {
    try {
      return await apiRequest<User>(`/api/auth/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify(user),
      });
    } catch (e) {
      console.warn("API updateUser failed:", e);
      return user;
    }
  },
  deleteUser: async (id: string): Promise<boolean> => {
    try {
      await apiRequest<{ success: boolean }>(`/api/auth/users/${id}`, {
        method: "DELETE",
      });
      return true;
    } catch (e) {
      console.warn("API deleteUser failed:", e);
      return false;
    }
  },

  // --- WITHDRAW REQUESTS ---
  getWithdrawRequests: async (): Promise<WithdrawRequest[]> => {
    try {
      return await apiRequest<WithdrawRequest[]>("/api/withdraws");
    } catch (e) {
      console.warn("API getWithdrawRequests failed, falling back to local:", e);
      const saved = localStorage.getItem("ml_withdraw_requests");
      return saved ? JSON.parse(saved) : [];
    }
  },
  createWithdrawRequest: async (request: WithdrawRequest): Promise<WithdrawRequest> => {
    try {
      return await apiRequest<WithdrawRequest>("/api/withdraws", {
        method: "POST",
        body: JSON.stringify(request),
      });
    } catch (e) {
      console.warn("API createWithdrawRequest failed:", e);
      return request;
    }
  },
  updateWithdrawRequest: async (request: WithdrawRequest): Promise<WithdrawRequest> => {
    try {
      return await apiRequest<WithdrawRequest>(`/api/withdraws/${request.id}`, {
        method: "PUT",
        body: JSON.stringify(request),
      });
    } catch (e) {
      console.warn("API updateWithdrawRequest failed:", e);
      return request;
    }
  },

  // --- CUSTOM PRODUCT REQUESTS ---
  getProductRequests: async (): Promise<ProductRequest[]> => {
    try {
      return await apiRequest<ProductRequest[]>("/api/product-requests");
    } catch (e) {
      console.warn("API getProductRequests failed, falling back to local:", e);
      const saved = localStorage.getItem("ml_product_requests");
      return saved ? JSON.parse(saved) : [];
    }
  },
  createProductRequest: async (request: ProductRequest): Promise<ProductRequest> => {
    try {
      return await apiRequest<ProductRequest>("/api/product-requests", {
        method: "POST",
        body: JSON.stringify(request),
      });
    } catch (e) {
      console.warn("API createProductRequest failed:", e);
      return request;
    }
  },
  updateProductRequest: async (request: ProductRequest): Promise<ProductRequest> => {
    try {
      return await apiRequest<ProductRequest>(`/api/product-requests/${request.id}`, {
        method: "PUT",
        body: JSON.stringify(request),
      });
    } catch (e) {
      console.warn("API updateProductRequest failed:", e);
      return request;
    }
  },

  // --- SITE CONFIG ---
  getSiteConfig: async (fallback: SiteConfig): Promise<SiteConfig> => {
    try {
      const config = await apiRequest<SiteConfig | null>("/api/siteconfig");
      return config || fallback;
    } catch (e) {
      console.warn("API getSiteConfig failed, falling back to local:", e);
      const saved = localStorage.getItem("mango_lover_site_config");
      return saved ? { ...fallback, ...JSON.parse(saved) } : fallback;
    }
  },
  updateSiteConfig: async (config: SiteConfig): Promise<SiteConfig> => {
    try {
      return await apiRequest<SiteConfig>("/api/siteconfig", {
        method: "POST",
        body: JSON.stringify(config),
      });
    } catch (e) {
      console.warn("API updateSiteConfig failed, falling back to local:", e);
      return config;
    }
  },
};
