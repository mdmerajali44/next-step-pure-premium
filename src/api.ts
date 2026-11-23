import { Product, Order, OrderStatus, Category, SiteConfig, User, WithdrawRequest, ProductRequest, Complaint, Expense, AuditLog } from "./types";

// Dynamic API URL from Vite environment variables (.env / .env.local)
// In production or when hosted together, empty string '' uses relative path, which is best for Render
const API_BASE = (import.meta as any).env?.VITE_API_URL || "";

// Helper for fetch requests
async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    cache: "no-store",
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
      const list = await apiRequest<Product[]>("/api/products");
      return Array.isArray(list) ? list : fallback;
    } catch {
      const saved = localStorage.getItem("ml_products");
      return saved ? JSON.parse(saved) : fallback;
    }
  },
  createProduct: async (product: Product): Promise<Product> => {
    return await apiRequest<Product>("/api/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  },
  updateProduct: async (product: Product): Promise<Product> => {
    return await apiRequest<Product>(`/api/products/${product.id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
  },
  deleteProduct: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: "DELETE",
      cache: "no-store",
    });
    if (res.ok || res.status === 404) return true;
    throw new Error(`HTTP Error ${res.status}`);
  },

  // --- CATEGORIES ---
  getCategories: async (fallback: Category[]): Promise<Category[]> => {
    const saved = localStorage.getItem("ml_categories");
    let localCategories: Category[] = [];
    try {
      if (saved) localCategories = JSON.parse(saved);
    } catch (e) {}

    try {
      const list = await apiRequest<Category[]>("/api/categories");
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
      return localCategories.length > 0 ? localCategories : fallback;
    } catch {
      return localCategories.length > 0 ? localCategories : fallback;
    }
  },
  createCategory: async (category: Category): Promise<Category> => {
    try {
      return await apiRequest<Category>("/api/categories", {
        method: "POST",
        body: JSON.stringify(category),
      });
    } catch {
      return category;
    }
  },
  updateCategory: async (category: Category): Promise<Category> => {
    try {
      return await apiRequest<Category>(`/api/categories/${category.id}`, {
        method: "PUT",
        body: JSON.stringify(category),
      });
    } catch {
      return category;
    }
  },
  deleteCategory: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/categories/${id}`, {
        method: "DELETE",
        cache: "no-store",
      });
      return res.ok || res.status === 404;
    } catch {
      return false;
    }
  },

  // --- ORDERS ---
  getOrders: async (fallback: Order[]): Promise<Order[]> => {
    try {
      const list = await apiRequest<Order[]>("/api/orders");
      return Array.isArray(list) ? list : fallback;
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
  bulkUpdateOrderStatus: async (orderIds: string[], status: OrderStatus): Promise<boolean> => {
    await apiRequest<{ success: boolean }>("/api/orders/bulk-status", {
      method: "PUT",
      body: JSON.stringify({ orderIds, status }),
    });
    return true;
  },
  deleteOrder: async (id: string, phone?: string, role?: string, userId?: string): Promise<boolean> => {
    try {
      const headers: Record<string, string> = {};
      if (phone) headers['x-requester-phone'] = phone;
      if (role) headers['x-requester-role'] = role;
      if (userId) headers['x-requester-id'] = userId;

      const res = await fetch(`${API_BASE}/api/orders/${id}`, {
        method: "DELETE",
        cache: "no-store",
        headers,
      });
      if (res.status === 403) {
        return false;
      }
      return res.ok || res.status === 404;
    } catch (e) {
      console.warn("API deleteOrder failed:", e);
      return true;
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
      const list = await apiRequest<User[]>("/api/auth/users");
      return Array.isArray(list) ? list : fallback;
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
      const res = await fetch(`${API_BASE}/api/auth/users/${id}`, {
        method: "DELETE",
        cache: "no-store",
      });
      return res.ok || res.status === 404;
    } catch (e) {
      console.warn("API deleteUser failed:", e);
      return false;
    }
  },

  // --- WITHDRAW REQUESTS ---
  getWithdrawRequests: async (): Promise<WithdrawRequest[]> => {
    try {
      const list = await apiRequest<WithdrawRequest[]>("/api/withdraws");
      return Array.isArray(list) ? list : [];
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
      const list = await apiRequest<ProductRequest[]>("/api/product-requests");
      return Array.isArray(list) ? list : [];
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
  deleteProductRequest: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/product-requests/${id}`, {
        method: "DELETE",
        cache: "no-store",
      });
      return res.ok || res.status === 404;
    } catch (e) {
      console.warn("API deleteProductRequest failed:", e);
      return false;
    }
  },

  // --- SITE CONFIG ---
  getSiteConfig: async (fallback: SiteConfig): Promise<SiteConfig> => {
    const saved = localStorage.getItem("mango_lover_site_config");
    let localObj: Partial<SiteConfig> = {};
    try {
      if (saved) localObj = JSON.parse(saved);
    } catch (e) {}

    try {
      const config = await apiRequest<SiteConfig | null>("/api/siteconfig");
      if (config) {
        return {
          ...fallback,
          ...config,
          categoryImages: {
            ...(fallback.categoryImages || {}),
            ...(config.categoryImages || {}),
            ...(localObj.categoryImages || {})
          },
          categoryBanners: {
            ...(fallback.categoryBanners || {}),
            ...(config.categoryBanners || {}),
            ...(localObj.categoryBanners || {})
          },
          categoryNames: {
            ...(fallback.categoryNames || {}),
            ...(config.categoryNames || {}),
            ...(localObj.categoryNames || {})
          },
          ...(localObj || {})
        };
      }
      return { ...fallback, ...localObj };
    } catch {
      return { ...fallback, ...localObj };
    }
  },
  updateSiteConfig: async (config: SiteConfig): Promise<SiteConfig> => {
    try {
      return await apiRequest<SiteConfig>("/api/siteconfig", {
        method: "POST",
        body: JSON.stringify(config),
      });
    } catch {
      return config;
    }
  },

  // --- COMPLAINTS & CRM ---
  getComplaints: async (fallback: Complaint[] = []): Promise<Complaint[]> => {
    try {
      const list = await apiRequest<Complaint[]>("/api/complaints");
      return Array.isArray(list) ? list : fallback;
    } catch (e) {
      console.warn("API getComplaints failed, falling back to local:", e);
      const saved = localStorage.getItem("ml_complaints");
      return saved ? JSON.parse(saved) : fallback;
    }
  },
  createComplaint: async (complaint: Partial<Complaint>): Promise<Complaint> => {
    try {
      return await apiRequest<Complaint>("/api/complaints", {
        method: "POST",
        body: JSON.stringify(complaint),
      });
    } catch (e) {
      console.warn("API createComplaint failed, using local:", e);
      const newC: Complaint = {
        id: complaint.id || 'CMP-' + Math.floor(100000 + Math.random() * 900000),
        orderId: complaint.orderId,
        customerName: complaint.customerName || 'গ্রাহক',
        customerPhone: complaint.customerPhone || '',
        customerAddress: complaint.customerAddress,
        issueCategory: complaint.issueCategory || 'other',
        issueCategoryLabel: complaint.issueCategoryLabel || 'সাধারণ সমস্যা',
        description: complaint.description || '',
        priority: complaint.priority || 'normal',
        status: complaint.status || 'pending',
        createdAt: complaint.createdAt || new Date().toLocaleDateString("bn-BD"),
        createdBy: complaint.createdBy || 'অ্যাডমিন',
        callLogs: complaint.callLogs || []
      };
      return newC;
    }
  },
  updateComplaint: async (complaint: Complaint): Promise<Complaint> => {
    try {
      return await apiRequest<Complaint>(`/api/complaints/${complaint.id}`, {
        method: "PUT",
        body: JSON.stringify(complaint),
      });
    } catch (e) {
      console.warn("API updateComplaint failed:", e);
      return complaint;
    }
  },
  addComplaintCallLog: async (complaintId: string, logData: { representativeName: string; notes: string; customerResponse?: string }): Promise<Complaint> => {
    try {
      return await apiRequest<Complaint>(`/api/complaints/${complaintId}/call-log`, {
        method: "POST",
        body: JSON.stringify(logData),
      });
    } catch (e) {
      console.warn("API addComplaintCallLog failed:", e);
      throw e;
    }
  },
  deleteComplaint: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/complaints/${id}`, {
        method: "DELETE",
        cache: "no-store",
      });
      return res.ok || res.status === 404;
    } catch (e) {
      console.warn("API deleteComplaint failed:", e);
      return true;
    }
  },

  // --- EXPENSES & ACCOUNTING ---
  getExpenses: async (): Promise<Expense[]> => {
    try {
      const list = await apiRequest<Expense[]>("/api/expenses");
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.warn("API getExpenses failed, falling back to local:", e);
      const saved = localStorage.getItem("ml_expenses");
      return saved ? JSON.parse(saved) : [];
    }
  },
  createExpense: async (expense: Omit<Expense, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): Promise<Expense> => {
    return await apiRequest<Expense>("/api/expenses", {
      method: "POST",
      body: JSON.stringify(expense),
    });
  },
  deleteExpense: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/expenses/${id}`, {
        method: "DELETE",
        cache: "no-store",
      });
      return res.ok || res.status === 404;
    } catch (e) {
      console.warn("API deleteExpense failed:", e);
      return true;
    }
  },

  // --- AUDIT LOGS ---
  getAuditLogs: async (): Promise<AuditLog[]> => {
    try {
      const list = await apiRequest<AuditLog[]>("/api/audit-logs");
      return Array.isArray(list) ? list : [];
    } catch (e) {
      const saved = localStorage.getItem("ml_audit_logs");
      return saved ? JSON.parse(saved) : [];
    }
  },
  createAuditLog: async (log: Omit<AuditLog, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): Promise<AuditLog> => {
    return await apiRequest<AuditLog>("/api/audit-logs", {
      method: "POST",
      body: JSON.stringify(log),
    });
  },
};
