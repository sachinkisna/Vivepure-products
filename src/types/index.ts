export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  discountPrice?: number;
  description: string;
  benefits?: string[];
  ingredients?: string[];
  usage?: string;
  stock: number;
  images: string[];
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  weight?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  itemCount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface DeliveryAddress {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: {
    userId?: string;
    name: string;
    email: string;
    phone: string;
  };
  deliveryAddress: DeliveryAddress;
  items: OrderItem[];
  subtotal: number;
  deliveryCharges: number;
  discount: number;
  total: number;
  couponCode?: string;
  paymentMethod: 'Cash on Delivery' | 'Online Payment';
  paymentStatus: 'Pending' | 'Paid';
  status: OrderStatus;
  timeline: OrderTimeline[];
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
}

export interface CreateOrderRequest {
  deliveryAddress: DeliveryAddress;
  items: Array<Pick<OrderItem, 'productId' | 'quantity'>>;
  couponCode?: string;
  paymentMethod: Order['paymentMethod'];
}

export interface CustomerSummary extends User {
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string;
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface AdminStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalSales: number;
  pendingOrders: number;
  deliveredOrders: number;
  lowStockProducts: number;
}
