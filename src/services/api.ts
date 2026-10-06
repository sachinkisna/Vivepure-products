import {
  Product,
  Category,
  Order,
  Review,
  User,
  AdminStats,
  CreateOrderRequest,
  CustomerSummary,
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_REVIEWS } from '../data/initialData';

const TOKEN_KEY = 'vivepanya_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const saveAuthSession = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// Common fetch helper with authorization headers
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!res.ok) {
      if (
        res.status === 401 &&
        token &&
        endpoint !== '/api/auth/login' &&
        endpoint !== '/api/auth/register'
      ) {
        clearAuthSession();
        window.dispatchEvent(new Event('auth:expired'));
      }
      const errData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.warn(`API call ${endpoint} failed:`, error?.message || error);
    throw error;
  }
}

export const api = {
  // --- Products ---
  async getProducts(params?: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    sort?: string;
  }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.minPrice !== undefined) query.set('minPrice', params.minPrice.toString());
    if (params?.maxPrice !== undefined) query.set('maxPrice', params.maxPrice.toString());
    if (params?.minRating) query.set('minRating', params.minRating.toString());
    if (params?.sort) query.set('sort', params.sort);

    let list: Product[];
    try {
      const qs = query.toString();
      const products = await request<Product[]>(`/api/products${qs ? `?${qs}` : ''}`);
      if (products.length > 0) {
        return products;
      }

      if (qs) {
        const storedProducts = await request<Product[]>('/api/products');
        if (storedProducts.length > 0) {
          return products;
        }
      }

      list = [...INITIAL_PRODUCTS];
    } catch {
      list = [...INITIAL_PRODUCTS];
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    if (params?.category && params.category !== 'All') {
      list = list.filter(p => p.category.toLowerCase() === params.category!.toLowerCase());
    }
    if (params?.minPrice !== undefined) {
      list = list.filter(p => (p.discountPrice || p.price) >= params.minPrice!);
    }
    if (params?.maxPrice !== undefined) {
      list = list.filter(p => (p.discountPrice || p.price) <= params.maxPrice!);
    }
    if (params?.minRating) {
      list = list.filter(p => p.rating >= params.minRating!);
    }

    if (params?.sort === 'price-low') {
      list.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (params?.sort === 'price-high') {
      list.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (params?.sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (params?.sort === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    }

    return list;
  },

  async getProductById(id: string): Promise<Product> {
    try {
      return await request<Product>(`/api/products/${id}`);
    } catch {
      const found = INITIAL_PRODUCTS.find(p => p.id === id || p.slug === id);
      if (found) return found;
      throw new Error('Product not found');
    }
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    return await request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return await request<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return await request<{ success: boolean }>(`/api/products/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Categories ---
  async getCategories(): Promise<Category[]> {
    try {
      return await request<Category[]>('/api/categories');
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  async createCategory(cat: { name: string; description?: string; image?: string }): Promise<Category> {
    return await request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(cat),
    });
  },

  // --- Orders ---
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    return await request<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async getOrders(): Promise<Order[]> {
    return await request<Order[]>('/api/orders');
  },

  async getOrderById(id: string): Promise<Order> {
    return await request<Order>(`/api/orders/${id}`);
  },

  async updateOrderStatus(id: string, status: Order['status'], note?: string): Promise<Order> {
    return await request<Order>(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    });
  },

  async cancelOrder(id: string, reason: string): Promise<Order> {
    return await request<Order>(`/api/orders/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  // --- Reviews ---
  async getReviews(productId: string): Promise<Review[]> {
    try {
      return await request<Review[]>(`/api/reviews/${productId}`);
    } catch {
      return INITIAL_REVIEWS.filter(r => r.productId === productId);
    }
  },

  async addReview(reviewData: {
    productId: string;
    rating: number;
    comment: string;
  }): Promise<Review> {
    return await request<Review>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  // --- Auth ---
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    saveAuthSession(res.token);
    return res;
  },

  async getCurrentUser(): Promise<User> {
    const result = await request<{ user: User }>('/api/auth/me');
    return result.user;
  },

  async register(name: string, email: string, password: string, phone?: string): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
    });
    saveAuthSession(res.token);
    return res;
  },

  // --- Admin ---
  async getAdminStats(): Promise<AdminStats> {
    return await request<AdminStats>('/api/admin/stats');
  },

  async getCustomers(): Promise<CustomerSummary[]> {
    return await request<CustomerSummary[]>('/api/admin/customers');
  },
};
