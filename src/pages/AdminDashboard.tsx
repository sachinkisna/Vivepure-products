import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { resolveProductImage } from '../components/ProductCard';
import { Product, Order, Category, AdminStats, OrderStatus, Review } from '../types';
import {
  Package, ShoppingBag, Users, IndianRupee, Clock, CheckCircle2,
  AlertTriangle, Plus, Edit, Trash2, ArrowUpDown, Filter, Eye, X,
  Save, RefreshCw, Shield, ChevronRight, Truck
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, showToast, setActivePage, adminDashboardTab, setAdminDashboardTab } = useShop();

  const [activeTab, setActiveTab] = useState(adminDashboardTab);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  useEffect(() => {
    setActiveTab(adminDashboardTab);
  }, [adminDashboardTab]);

  const selectAdminTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setAdminDashboardTab(tab);
  };

  // Filter in admin
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('All');

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, prods, ords, cats, custs, reviewData] = await Promise.all([
        api.getAdminStats(),
        api.getProducts(),
        api.getOrders(),
        api.getCategories(),
        api.getCustomers(),
        api.getAdminReviews(),
      ]);
      setStats(statsData);
      setProducts(prods);
      setOrders(ords);
      setCategories(cats);
      setCustomers(custs);
      setReviews(reviewData);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // --- Product Management Handlers ---
  const handleOpenAddProduct = () => {
    setEditingProduct({
      name: '',
      category: categories[0]?.name || 'Handmade Soaps',
      price: 150,
      discountPrice: 135,
      description: '',
      stock: 50,
      weight: '125g',
      images: ['/src/assets/images/product_neem_tulsi_soap_1790230422423.jpg'],
      rating: 4.8,
      reviewCount: 0,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      benefits: ['100% Herbal & Pure', 'Gentle on all skin types'],
      ingredients: ['Pure botanical extracts', 'Essential oils'],
    });
    setProductModalOpen(true);
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct({ ...prod });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name) return;

    const productData = {
      ...editingProduct,
      images: (editingProduct.images ?? []).map(image => image.trim()).filter(Boolean),
    };

    try {
      if (editingProduct.id) {
        // Update
        const updated = await api.updateProduct(editingProduct.id, productData);
        setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
        showToast(`Updated product "${updated.name}"`);
      } else {
        // Create
        const created = await api.createProduct(productData);
        setProducts(prev => [created, ...prev]);
        showToast(`Created new product "${created.name}"`);
      }
      setProductModalOpen(false);
      setEditingProduct(null);
      // Refresh stats
      api.getAdminStats().then(s => setStats(s));
    } catch (err: any) {
      showToast(err?.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast(`Deleted product "${name}"`);
      api.getAdminStats().then(s => setStats(s));
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete product');
    }
  };

  const handleModerateReview = async (review: Review, status: 'approved' | 'rejected') => {
    try {
      const updated = await api.moderateReview(review.id, status);
      setReviews(prev => prev.map(item => item.id === updated.id ? updated : item));
      showToast(status === 'approved' ? 'Review approved and published.' : 'Review rejected.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update review.');
    }
  };

  // --- Category Handlers ---
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const created = await api.createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim(),
        image: '/src/assets/images/hero_handcrafted_skincare_1790230406036.jpg',
      });
      setCategories(prev => [...prev, created]);
      setNewCategoryName('');
      setNewCategoryDesc('');
      setCategoryModalOpen(false);
      showToast(`Category "${created.name}" created`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to create category');
    }
  };

  // --- Order Status Handler ---
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const updated = await api.updateOrderStatus(orderId, status, `Status changed by Admin`);
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      if (selectedOrderDetails?.id === updated.id) {
        setSelectedOrderDetails(updated);
      }
      showToast(`Order #${updated.orderNumber} updated to ${status}`);
      api.getAdminStats().then(s => setStats(s));
    } catch (err: any) {
      showToast(err?.message || 'Failed to update order status');
    }
  };

  const handleAdminCancelOrder = async (orderId: string) => {
    const reason = prompt('Please enter cancellation reason:', 'Cancelled by Admin store manager');
    if (reason === null) return;

    try {
      const updated = await api.cancelOrder(orderId, reason);
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      if (selectedOrderDetails?.id === updated.id) {
        setSelectedOrderDetails(updated);
      }
      showToast(`Order #${updated.orderNumber} cancelled`);
      api.getAdminStats().then(s => setStats(s));
    } catch (err: any) {
      showToast(err?.message || 'Failed to cancel order');
    }
  };

  const filteredOrders = orders.filter(o =>
    orderStatusFilter === 'All' ? true : o.status === orderStatusFilter
  );

  const filteredProducts = products.filter(p =>
    productCategoryFilter === 'All' ? true : p.category === productCategoryFilter
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header Bar */}
      <div className="bg-[#173F35] text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#B9944A] tracking-wider uppercase">
            <Shield className="w-4 h-4" />
            <span>Store Administration Portal</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-white mt-1">
            VIVEPANYA Business Dashboard
          </h1>
          <p className="text-xs text-[#CADAD5] mt-1">
            Logged in as {user?.email || 'Administrator'} · Complete product catalogue, order fulfillment, and customer control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllAdminData}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Data</span>
          </button>
          <button
            onClick={() => setActivePage('shop')}
            className="px-3 py-2 bg-[#B9944A] hover:bg-[#caa75e] text-[#112F28] rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Go to Store
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E7E2D6] gap-4 sm:gap-8 text-xs sm:text-sm font-semibold overflow-x-auto pb-px">
        <button
          onClick={() => selectAdminTab('overview')}
          className={`pb-3 border-b-2 cursor-pointer whitespace-nowrap transition-colors ${
            activeTab === 'overview'
              ? 'border-[#173F35] text-[#173F35]'
              : 'border-transparent text-[#6A7B74] hover:text-[#17372F]'
          }`}
        >
          Dashboard Overview
        </button>
        <button
          onClick={() => selectAdminTab('products')}
          className={`pb-3 border-b-2 cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'products'
              ? 'border-[#173F35] text-[#173F35]'
              : 'border-transparent text-[#6A7B74] hover:text-[#17372F]'
          }`}
        >
          <span>Products Management</span>
          <span className="text-[10px] bg-[#EAF2EC] text-[#173F35] px-1.5 py-0.2 rounded-full tabular-nums">
            {products.length}
          </span>
        </button>
        <button
          onClick={() => selectAdminTab('orders')}
          className={`pb-3 border-b-2 cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'border-[#173F35] text-[#173F35]'
              : 'border-transparent text-[#6A7B74] hover:text-[#17372F]'
          }`}
        >
          <span>Orders & Fulfillment</span>
          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full tabular-nums">
            {stats?.pendingOrders || 0}
          </span>
        </button>
        <button
          onClick={() => selectAdminTab('categories')}
          className={`pb-3 border-b-2 cursor-pointer whitespace-nowrap transition-colors ${
            activeTab === 'categories'
              ? 'border-[#173F35] text-[#173F35]'
              : 'border-transparent text-[#6A7B74] hover:text-[#17372F]'
          }`}
        >
          Categories ({categories.length})
        </button>
        <button
          onClick={() => selectAdminTab('customers')}
          className={`pb-3 border-b-2 cursor-pointer whitespace-nowrap transition-colors ${
            activeTab === 'customers'
              ? 'border-[#173F35] text-[#173F35]'
              : 'border-transparent text-[#6A7B74] hover:text-[#17372F]'
          }`}
        >
          Customers ({customers.length})
        </button>
        <button
          onClick={() => selectAdminTab('reviews')}
          className={`pb-3 border-b-2 cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'reviews'
              ? 'border-[#173F35] text-[#173F35]'
              : 'border-transparent text-[#6A7B74] hover:text-[#17372F]'
          }`}
        >
          <span>Reviews Approval</span>
          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full tabular-nums">
            {reviews.filter(review => (review.status ?? 'approved') === 'pending').length}
          </span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW METRIC CARDS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Top 6 KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-[#E7E2D6] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-[#EAF2EC] text-[#173F35] flex items-center justify-center mb-3">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-[#7A8A84] uppercase">Total Products</span>
              <p className="font-serif text-2xl font-bold text-[#17372F] mt-1 tabular-nums">
                {stats?.totalProducts || products.length}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E7E2D6] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-[#F6EEDC] text-[#B9944A] flex items-center justify-center mb-3">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-[#7A8A84] uppercase">Total Orders</span>
              <p className="font-serif text-2xl font-bold text-[#17372F] mt-1 tabular-nums">
                {stats?.totalOrders || orders.length}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E7E2D6] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <IndianRupee className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-[#7A8A84] uppercase">Total Revenue</span>
              <p className="font-serif text-2xl font-bold text-[#17372F] mt-1 tabular-nums">
                ₹{stats?.totalSales || 0}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E7E2D6] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-[#7A8A84] uppercase">Registered Users</span>
              <p className="font-serif text-2xl font-bold text-[#17372F] mt-1 tabular-nums">
                {stats?.totalCustomers || customers.length}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E7E2D6] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-[#7A8A84] uppercase">Pending Orders</span>
              <p className="font-serif text-2xl font-bold text-[#17372F] mt-1 tabular-nums">
                {stats?.pendingOrders || 0}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E7E2D6] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-[#7A8A84] uppercase">Delivered Orders</span>
              <p className="font-serif text-2xl font-bold text-[#17372F] mt-1 tabular-nums">
                {stats?.deliveredOrders || 0}
              </p>
            </div>

          </div>

          {/* Low Stock Warning Alert Strip */}
          {products.filter(p => p.stock < 20).length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Inventory Alert: Low Stock Products (&lt; 20 units)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {products.filter(p => p.stock < 20).map((p) => (
                  <div key={p.id} className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#17372F] line-clamp-1">{p.name}</p>
                      <p className="text-[11px] text-[#7A8A84]">{p.category}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold tabular-nums">
                      {p.stock} left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders Snapshot */}
          <div className="bg-white rounded-2xl border border-[#E7E2D6] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-[#17372F]">Recent Orders</h2>
              <button
                onClick={() => selectAdminTab('orders')}
                className="text-xs font-semibold text-[#173F35] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({orders.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#F0ECE2] max-h-96 overflow-y-auto">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#17372F]">{order.orderNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-gray-100 text-gray-800">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[#6A7B74] mt-0.5">
                      {order.deliveryAddress.name} ({order.deliveryAddress.city}) · {order.items.length} items
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-[#17372F] tabular-nums">₹{order.total}</span>
                    <button
                      onClick={() => {
                        setSelectedOrderDetails(order);
                        selectAdminTab('orders');
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#FAF8F5] border border-[#DBD5C5] text-[#173F35] hover:bg-[#EAF2EC] cursor-pointer"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="bg-white border border-[#DBD5C5] rounded-xl px-3 py-2 text-xs text-[#17372F] focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories ({products.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenAddProduct}
              className="inline-flex items-center gap-1.5 py-2 px-4 bg-[#173F35] text-white text-xs font-bold rounded-xl hover:bg-[#235D4E] transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#E7E2D6] overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF8F5] border-b border-[#E7E2D6] text-[#17372F]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Product</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold text-right">Price</th>
                  <th className="py-3 px-4 font-semibold text-right">Discount</th>
                  <th className="py-3 px-4 font-semibold text-center">Stock</th>
                  <th className="py-3 px-4 font-semibold text-center">Rating</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE2] text-[#4C5E58]">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveProductImage(p.images?.[0] || '')}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover bg-[#F2EEE4]"
                        />
                        <div>
                          <p className="font-semibold text-[#17372F] line-clamp-1">{p.name}</p>
                          <span className="text-[10px] text-[#7A8A84]">{p.weight || 'Standard'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#173F35] font-medium">{p.category}</td>
                    <td className="py-3 px-4 text-right font-medium tabular-nums">₹{p.price}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-emerald-700 font-semibold">
                      {p.discountPrice ? `₹${p.discountPrice}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold tabular-nums ${
                        p.stock < 20 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                      }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums">{p.rating} ★</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditProduct(p)}
                          className="p-1.5 text-[#173F35] hover:bg-[#EAF2EC] rounded-lg transition-colors cursor-pointer"
                          title="Edit product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS & FULFILLMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#7A8A84]" />
              <span className="text-xs text-[#6A7B74]">Filter Status:</span>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-white border border-[#DBD5C5] rounded-xl px-3 py-1.5 text-xs text-[#17372F] focus:outline-none cursor-pointer"
              >
                <option value="All">All Statuses ({orders.length})</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Packed">Packed</option>
                <option value="Shipped">Shipped</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <p className="text-xs text-[#6A7B74]">
              Showing <span className="font-bold text-[#17372F] tabular-nums">{filteredOrders.length}</span> orders
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Orders Table */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E7E2D6] overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF8F5] border-b border-[#E7E2D6] text-[#17372F]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Order ID</th>
                    <th className="py-3 px-4 font-semibold">Customer</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold text-right">Amount</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0ECE2] text-[#4C5E58]">
                  {filteredOrders.map((ord) => (
                    <tr
                      key={ord.id}
                      onClick={() => setSelectedOrderDetails(ord)}
                      className={`hover:bg-[#FAF8F5] transition-colors cursor-pointer ${
                        selectedOrderDetails?.id === ord.id ? 'bg-[#FAF8F5]' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#17372F] tabular-nums">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#17372F]">{ord.deliveryAddress.name}</p>
                        <p className="text-[10px] text-[#7A8A84]">{ord.deliveryAddress.city}</p>
                      </td>
                      <td className="py-3 px-4 text-[#7A8A84] tabular-nums">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#17372F] tabular-nums">
                        ₹{ord.total}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderDetails(ord);
                          }}
                          className="p-1 text-[#173F35] hover:bg-[#EAF2EC] rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Order Inspection & Status Control Drawer */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E7E2D6] p-5 shadow-xs space-y-4">
              {selectedOrderDetails ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE2]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#7A8A84]">Order Management</span>
                      <h3 className="font-mono text-base font-bold text-[#17372F]">
                        {selectedOrderDetails.orderNumber}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedOrderDetails(null)}
                      className="text-[#7A8A84] hover:text-[#17372F]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status Updator Dropdown */}
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#DBD5C5] space-y-2">
                    <label className="block text-xs font-bold text-[#17372F]">
                      Update Status:
                    </label>
                    <select
                      value={selectedOrderDetails.status}
                      onChange={(e) => handleUpdateOrderStatus(selectedOrderDetails.id, e.target.value as OrderStatus)}
                      className="w-full bg-white border border-[#DBD5C5] rounded-lg p-2 text-xs font-semibold text-[#17372F] focus:outline-none cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Packed">Packed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Customer Information */}
                  <div className="text-xs space-y-1.5 text-[#52615D]">
                    <p className="font-bold text-[#17372F] text-[11px] uppercase tracking-wider">
                      Customer & Shipping Address
                    </p>
                    <p className="font-semibold text-[#17372F]">{selectedOrderDetails.deliveryAddress.name}</p>
                    <p>{selectedOrderDetails.deliveryAddress.address}</p>
                    <p>{selectedOrderDetails.deliveryAddress.city}, {selectedOrderDetails.deliveryAddress.state} - {selectedOrderDetails.deliveryAddress.pincode}</p>
                    <p>Phone: {selectedOrderDetails.deliveryAddress.phone}</p>
                    <p>Email: {selectedOrderDetails.deliveryAddress.email}</p>
                  </div>

                  {/* Items */}
                  <div className="text-xs space-y-2 pt-2 border-t border-[#F0ECE2]">
                    <p className="font-bold text-[#17372F] text-[11px] uppercase tracking-wider">
                      Items Ordered ({selectedOrderDetails.items.length})
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {selectedOrderDetails.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between py-1">
                          <span className="line-clamp-1">{i.quantity}x {i.name}</span>
                          <span className="font-semibold tabular-nums">₹{i.price * i.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="pt-2 border-t border-[#F0ECE2] flex justify-between items-baseline text-xs">
                    <span className="font-bold text-[#17372F]">Total Amount:</span>
                    <span className="font-serif text-lg font-bold text-[#17372F] tabular-nums">
                      ₹{selectedOrderDetails.total}
                    </span>
                  </div>

                  {selectedOrderDetails.status !== 'Cancelled' && (
                    <button
                      onClick={() => handleAdminCancelOrder(selectedOrderDetails.id)}
                      className="w-full py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-16 text-xs text-[#7A8A84]">
                  Select an order on the left to inspect customer details and advance status.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORIES MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-xl font-bold text-[#17372F]">Product Categories</h2>
            <button
              onClick={() => setCategoryModalOpen(true)}
              className="inline-flex items-center gap-1.5 py-2 px-4 bg-[#173F35] text-white text-xs font-bold rounded-xl hover:bg-[#235D4E] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-[#E7E2D6] space-y-3">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#F2EEE4]">
                  <img src={resolveProductImage(c.image)} alt={c.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#17372F]">{c.name}</h3>
                  <p className="text-xs text-[#6A7B74] mt-0.5 line-clamp-2">{c.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REGISTERED CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-[#E7E2D6] overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF8F5] border-b border-[#E7E2D6] text-[#17372F]">
              <tr>
                <th className="py-3 px-4 font-semibold">Customer Name</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Phone</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Registered On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE2] text-[#4C5E58]">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-[#FAF8F5]/60">
                  <td className="py-3 px-4 font-bold text-[#17372F]">{c.name}</td>
                  <td className="py-3 px-4 text-[#173F35]">{c.email}</td>
                  <td className="py-3 px-4">{c.phone || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.role === 'admin' ? 'bg-[#173F35] text-white' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {c.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#7A8A84] tabular-nums">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#17372F]">Customer Reviews</h2>
            <p className="text-xs text-[#6A7B74] mt-1">Approve reviews to publish them, or reject them to keep them hidden.</p>
          </div>
          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E7E2D6] p-8 text-center text-xs text-[#6A7B74]">
              No customer reviews have been submitted.
            </div>
          ) : (
            reviews
              .slice()
              .sort((a, b) => Number((b.status ?? 'approved') === 'pending') - Number((a.status ?? 'approved') === 'pending'))
              .map(review => (
                <article key={review.id} className="bg-white rounded-2xl border border-[#E7E2D6] p-5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-sm text-[#17372F]">
                        {products.find(product => product.id === review.productId)?.name ?? 'Product'}
                      </h3>
                      <p className="text-xs text-[#6A7B74] mt-1">
                        {review.customerName} · {review.customerEmail} · {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      (review.status ?? 'approved') === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : review.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {review.status ?? 'approved'}
                    </span>
                  </div>
                  <p className="text-xs text-[#B9944A]">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                  <p className="text-sm text-[#4C5E58] whitespace-pre-wrap">{review.comment}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleModerateReview(review, 'approved')}
                      disabled={(review.status ?? 'approved') === 'approved'}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleModerateReview(review, 'rejected')}
                      disabled={review.status === 'rejected'}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 disabled:opacity-50 cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))
          )}
        </div>
      )}

      {/* Modal: Add / Edit Product */}
      {productModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-[#DBD5C5] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E7E2D6]">
              <h3 className="font-serif text-xl font-bold text-[#17372F]">
                {editingProduct.id ? 'Edit Product' : 'Add New Handcrafted Product'}
              </h3>
              <button
                onClick={() => setProductModalOpen(false)}
                className="text-[#7A8A84] hover:text-[#17372F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#17372F] mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="e.g. Pure Sandalwood & Turmeric Soap"
                    className="w-full bg-white border border-[#DBD5C5] rounded-xl py-2 px-3 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#17372F] mb-1">
                    Category *
                  </label>
                  <select
                    value={editingProduct.category || categories[0]?.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-white border border-[#DBD5C5] rounded-xl py-2 px-3 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#17372F] mb-1">
                    Price (MRP ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full bg-white border border-[#DBD5C5] rounded-xl py-2 px-3 text-xs text-[#1E2E2A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#17372F] mb-1">
                    Discounted Price (₹)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.discountPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, discountPrice: Number(e.target.value) })}
                    className="w-full bg-white border border-[#DBD5C5] rounded-xl py-2 px-3 text-xs text-[#1E2E2A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#17372F] mb-1">
                    Available Stock *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full bg-white border border-[#DBD5C5] rounded-xl py-2 px-3 text-xs text-[#1E2E2A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17372F] mb-1">
                  Product Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Formulation details, ingredients and natural benefits..."
                  className="w-full bg-white border border-[#DBD5C5] rounded-xl p-3 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#17372F] mb-1">
                    Ingredients Transparency
                  </label>
                  <textarea
                    rows={4}
                    value={editingProduct.ingredients?.join('\n') || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      ingredients: e.target.value.split('\n').map(value => value.trim()).filter(Boolean),
                    })}
                    placeholder={'One ingredient per line'}
                    className="w-full bg-white border border-[#DBD5C5] rounded-xl p-3 text-xs text-[#1E2E2A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17372F] mb-1">
                    Key Benefits / Formulation Highlights
                  </label>
                  <textarea
                    rows={4}
                    value={editingProduct.benefits?.join('\n') || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      benefits: e.target.value.split('\n').map(value => value.trim()).filter(Boolean),
                    })}
                    placeholder={'One benefit per line'}
                    className="w-full bg-white border border-[#DBD5C5] rounded-xl p-3 text-xs text-[#1E2E2A]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#17372F] mb-1">
                  Recommended Usage
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.usage || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, usage: e.target.value })}
                  placeholder="How customers should use this product"
                  className="w-full bg-white border border-[#DBD5C5] rounded-xl p-3 text-xs text-[#1E2E2A]"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#17372F]">
                      Product Gallery Images
                    </label>
                    <p className="text-[10px] text-[#7A8A84] mt-0.5">
                      First image is the main product image; additional images appear in the gallery.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingProduct({
                      ...editingProduct,
                      images: [...(editingProduct.images ?? []), ''],
                    })}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-[#EAF2EC] text-[#173F35] text-xs font-semibold hover:bg-[#DDECE2] cursor-pointer"
                  >
                    + Add image
                  </button>
                </div>
                {(editingProduct.images ?? ['']).map((image, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-[#52615D] mb-1">
                        {index === 0 ? 'Main image URL *' : `Gallery image ${index + 1} URL`}
                      </label>
                      <input
                        type="text"
                        required={index === 0}
                        value={image}
                        onChange={(e) => {
                          const images = [...(editingProduct.images ?? [])];
                          images[index] = e.target.value;
                          setEditingProduct({ ...editingProduct, images });
                        }}
                        placeholder="/src/assets/images/product_image.jpg or https://..."
                        className="w-full bg-white border border-[#DBD5C5] rounded-xl py-2 px-3 text-xs text-[#1E2E2A]"
                      />
                    </div>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => setEditingProduct({
                          ...editingProduct,
                          images: (editingProduct.images ?? []).filter((_, imageIndex) => imageIndex !== index),
                        })}
                        aria-label={`Remove gallery image ${index + 1}`}
                        className="mt-5 p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {image.trim() && (
                      <img
                        src={resolveProductImage(image.trim())}
                        alt={`Preview ${index + 1}`}
                        className="mt-5 w-10 h-10 rounded-lg object-cover border border-[#E7E2D6] bg-[#F2EEE4]"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isFeatured || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                    className="accent-[#173F35]"
                  />
                  <span>Featured Product</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isBestSeller || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isBestSeller: e.target.checked })}
                    className="accent-[#173F35]"
                  />
                  <span>Best Seller Flag</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isNewArrival || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isNewArrival: e.target.checked })}
                    className="accent-[#173F35]"
                  />
                  <span>New Arrival Flag</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E7E2D6]">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="py-2 px-4 rounded-xl border border-[#DBD5C5] text-xs font-semibold text-[#17372F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-[#173F35] text-white text-xs font-bold rounded-xl hover:bg-[#235D4E] cursor-pointer shadow-sm"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Category */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] rounded-3xl max-w-md w-full p-6 border border-[#DBD5C5] shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#E7E2D6]">
              <h3 className="font-serif text-lg font-bold text-[#17372F]">Add Product Category</h3>
              <button onClick={() => setCategoryModalOpen(false)} className="text-[#7A8A84]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#17372F] mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Aromatherapy Oils"
                  className="w-full bg-white border border-[#DBD5C5] rounded-xl py-2 px-3 text-xs text-[#1E2E2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17372F] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Short summary of this product group"
                  className="w-full bg-white border border-[#DBD5C5] rounded-xl p-2.5 text-xs text-[#1E2E2A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="py-1.5 px-3 border border-[#DBD5C5] text-xs font-medium rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-4 bg-[#173F35] text-white text-xs font-bold rounded-xl"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
