import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, User } from '../types';
import { api, clearAuthSession, getStoredToken } from '../services/api';

interface ShopContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  deliveryCharges: number;
  appliedCoupon: string | null;
  discountAmount: number;
  cartTotal: number;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  user: User | null;
  authLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  activePage: string;
  setActivePage: (page: string) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  lastPlacedOrderId: string | null;
  setLastPlacedOrderId: (id: string | null) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'vivepanya_cart_items';

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activePage, setActivePage] = useState<string>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastPlacedOrderId, setLastPlacedOrderId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to sync cart to localStorage', e);
    }
  }, [cart]);

  useEffect(() => {
    let active = true;
    if (!getStoredToken()) {
      setAuthLoading(false);
      return;
    }

    api.getCurrentUser()
      .then(authenticatedUser => {
        if (active) setUser(authenticatedUser);
      })
      .catch(() => {
        clearAuthSession();
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleExpiredSession = () => {
      clearAuthSession();
      setUser(null);
      showToast('Your session expired. Please sign in again.');
      if (activePage === 'admin' || activePage === 'orders' || activePage === 'checkout') {
        setActivePage('home');
      }
    };
    window.addEventListener('auth:expired', handleExpiredSession);
    return () => window.removeEventListener('auth:expired', handleExpiredSession);
  }, [activePage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2800);
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`Added "${product.name}" to cart`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showToast('Item removed from cart');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartSubtotal = cart.reduce((sum, item) => {
    const unitPrice = item.product.discountPrice || item.product.price;
    return sum + unitPrice * item.quantity;
  }, 0);

  // Delivery fee logic: Free delivery over ₹499, otherwise ₹50
  const deliveryCharges = cartSubtotal > 499 || cartSubtotal === 0 ? 0 : 50;

  // Coupon logic
  let discountAmount = 0;
  if (appliedCoupon === 'VIVE10') {
    discountAmount = Math.round(cartSubtotal * 0.1);
  } else if (appliedCoupon === 'WELCOME20') {
    discountAmount = Math.round(cartSubtotal * 0.2);
  } else if (appliedCoupon === 'FLAT100' && cartSubtotal >= 500) {
    discountAmount = 100;
  }

  const cartTotal = Math.max(0, cartSubtotal + deliveryCharges - discountAmount);

  const applyCoupon = (code: string) => {
    const formatted = code.trim().toUpperCase();
    if (formatted === 'VIVE10') {
      setAppliedCoupon('VIVE10');
      showToast('Coupon VIVE10 applied! 10% discount');
      return { success: true, message: '10% discount applied successfully!' };
    }
    if (formatted === 'WELCOME20') {
      setAppliedCoupon('WELCOME20');
      showToast('Coupon WELCOME20 applied! 20% discount');
      return { success: true, message: '20% welcome discount applied!' };
    }
    if (formatted === 'FLAT100') {
      if (cartSubtotal < 500) {
        return { success: false, message: 'FLAT100 requires minimum order of ₹500' };
      }
      setAppliedCoupon('FLAT100');
      showToast('Coupon FLAT100 applied! ₹100 discount');
      return { success: true, message: '₹100 discount applied!' };
    }
    return { success: false, message: 'Invalid coupon code. Try VIVE10 or WELCOME20' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed');
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
    showToast('Logged out successfully');
    if (activePage === 'admin') {
      setActivePage('home');
    }
  };

  return (
    <ShopContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        deliveryCharges,
        appliedCoupon,
        discountAmount,
        cartTotal,
        applyCoupon,
        removeCoupon,
        user,
        authLoading,
        setUser,
        logout,
        activePage,
        setActivePage,
        selectedProductId,
        setSelectedProductId,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        toastMessage,
        showToast,
        lastPlacedOrderId,
        setLastPlacedOrderId,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
