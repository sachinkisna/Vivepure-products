import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { resolveProductImage } from '../components/ProductCard';
import { Order, OrderStatus } from '../types';
import { Search, Package, CheckCircle, Clock, Truck, Home, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_STEPS: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

export const MyOrdersPage: React.FC = () => {
  const { user, setActivePage, showToast } = useShop();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOrderId, setSearchOrderId] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Cancellation modal state
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        const data = await api.getOrders();
        setOrders(data);
        if (data.length > 0) {
          setExpandedOrderId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [user]);

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchOrderId.trim()) return;

    try {
      const found = await api.getOrderById(searchOrderId.trim());
      setOrders([found]);
      setExpandedOrderId(found.id);
      showToast(`Found Order #${found.orderNumber}`);
    } catch {
      showToast('Order not found. Please verify Order ID.');
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancellingOrder) return;
    setCancelLoading(true);
    try {
      const updated = await api.cancelOrder(cancellingOrder.id, cancelReason || 'Cancelled by customer');
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      showToast(`Order #${updated.orderNumber} has been cancelled`);
      setCancellingOrder(null);
      setCancelReason('');
    } catch (err: any) {
      showToast(err?.message || 'Failed to cancel order');
    } finally {
      setCancelLoading(false);
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'Cancelled') return -1;
    return STATUS_STEPS.indexOf(status);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Title & Quick Tracker */}
      <div className="border-b border-[#E7E2D6] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#173F35]">
            Account Management
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#17372F] mt-1">
            Order History & Tracking
          </h1>
          <p className="text-xs text-[#6A7B74] mt-0.5">
            {user ? `Orders for ${user.email}` : 'Sign in to view and track your orders'}
          </p>
        </div>

        {/* Guest / Direct Order ID Lookup */}
        <form onSubmit={handleSearchOrder} className="flex gap-2">
          <input
            type="text"
            value={searchOrderId}
            onChange={(e) => setSearchOrderId(e.target.value)}
            placeholder="Enter Order ID (e.g. VP-2026-1001)"
            className="w-56 bg-white border border-[#DBD5C5] rounded-xl py-1.5 px-3 text-xs text-[#1E2E2A] uppercase focus:outline-none focus:border-[#173F35]"
          />
          <button
            type="submit"
            className="py-1.5 px-3 bg-[#173F35] text-white rounded-xl text-xs font-semibold hover:bg-[#235D4E] flex items-center gap-1 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Track</span>
          </button>
        </form>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#6A7B74]">
          Loading your order history...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E7E2D6] p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#EAF2EC] text-[#173F35] flex items-center justify-center mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#17372F]">No Orders Yet</h3>
          <p className="text-xs text-[#6A7B74] max-w-sm mx-auto">
            When you place orders for our handcrafted soaps or virgin coconut oil, they will be tracked right here with real-time status updates.
          </p>
          <button
            onClick={() => setActivePage('shop')}
            className="py-2.5 px-5 bg-[#173F35] text-white text-xs font-semibold rounded-xl hover:bg-[#235D4E] cursor-pointer"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const currentStep = getStepIndex(order.status);
            const isCancelled = order.status === 'Cancelled';
            const canCancel = order.status === 'Pending' || order.status === 'Confirmed';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-[#E7E2D6] shadow-xs overflow-hidden"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF8F5] transition-colors border-b border-[#F0ECE2]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#EAF2EC] flex items-center justify-center text-[#173F35]">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#17372F] tabular-nums">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isCancelled
                              ? 'bg-rose-100 text-rose-800'
                              : order.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#7A8A84] mt-0.5 tabular-nums">
                        Placed on {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-xs text-[#7A8A84]">Total:</span>
                      <p className="font-serif text-lg font-bold text-[#17372F] tabular-nums">
                        ₹{order.total}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#7A8A84]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#7A8A84]" />
                    )}
                  </div>
                </div>

                {/* Progress Visual Tracker */}
                <div className="p-5 sm:p-6 bg-[#FAF8F5] border-b border-[#F0ECE2]">
                  {isCancelled ? (
                    <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>
                        <strong>Order Cancelled:</strong> {order.cancellationReason || 'Cancelled upon request'}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#17372F] mb-4">
                        Delivery Timeline
                      </p>
                      
                      {/* Responsive Stepper */}
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                        {STATUS_STEPS.map((step, idx) => {
                          const isDone = currentStep >= idx;
                          const isCurrent = currentStep === idx;

                          return (
                            <div key={step} className="flex flex-col items-center text-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1.5 ${
                                  isDone
                                    ? 'bg-[#173F35] text-white shadow-xs'
                                    : 'bg-[#E7E2D6] text-[#7A8A84]'
                                } ${isCurrent ? 'ring-4 ring-[#173F35]/20' : ''}`}
                              >
                                {isDone ? '✓' : idx + 1}
                              </div>
                              <span
                                className={`text-[11px] leading-tight ${
                                  isCurrent
                                    ? 'font-bold text-[#173F35]'
                                    : isDone
                                    ? 'font-semibold text-[#17372F]'
                                    : 'text-[#8A9690]'
                                }`}
                              >
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expandable Order Details */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-6">
                    {/* Items Grid */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-[#17372F] uppercase tracking-wider">
                        Ordered Items
                      </h4>
                      <div className="divide-y divide-[#F0ECE2]">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <img
                                src={resolveProductImage(item.image)}
                                alt=""
                                className="w-12 h-12 rounded-lg object-cover bg-[#F2EEE4]"
                              />
                              <div>
                                <p className="font-semibold text-[#17372F]">{item.name}</p>
                                <span className="text-[11px] text-[#7A8A84] tabular-nums">
                                  Qty: {item.quantity} × ₹{item.price}
                                </span>
                              </div>
                            </div>
                            <span className="font-bold text-[#17372F] tabular-nums">
                              ₹{item.price * item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Address & Payment Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3 border-t border-[#F0ECE2] text-xs text-[#52615D]">
                      <div>
                        <p className="font-bold text-[#17372F] mb-1 uppercase tracking-wider text-[10px]">
                          Delivery Address
                        </p>
                        <p className="font-semibold text-[#17372F]">{order.deliveryAddress.name}</p>
                        <p>{order.deliveryAddress.address}</p>
                        <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
                        <p className="mt-1">Phone: {order.deliveryAddress.phone}</p>
                      </div>

                      <div>
                        <p className="font-bold text-[#17372F] mb-1 uppercase tracking-wider text-[10px]">
                          Payment Details
                        </p>
                        <p>Method: <strong>{order.paymentMethod}</strong></p>
                        <p>Status: <strong className="text-emerald-700">{order.paymentStatus}</strong></p>
                        {order.couponCode && (
                          <p>Coupon Applied: <strong>{order.couponCode}</strong></p>
                        )}
                        <p className="mt-1 font-serif text-base font-bold text-[#17372F] tabular-nums">
                          Total: ₹{order.total}
                        </p>
                      </div>
                    </div>

                    {/* Timeline Log */}
                    {order.timeline && order.timeline.length > 0 && (
                      <div className="pt-3 border-t border-[#F0ECE2]">
                        <p className="text-xs font-bold text-[#17372F] uppercase tracking-wider mb-2">
                          Status Updates
                        </p>
                        <div className="space-y-1.5 text-xs text-[#52615D]">
                          {order.timeline.map((entry, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#173F35] mt-1.5 shrink-0" />
                              <div>
                                <span className="font-semibold text-[#17372F]">{entry.status}</span>
                                {entry.note && <span className="text-[#6A7B74]"> — {entry.note}</span>}
                                <span className="text-[10px] text-[#8A9690] ml-2 tabular-nums">
                                  ({new Date(entry.timestamp).toLocaleString()})
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {canCancel && (
                      <div className="pt-3 border-t border-[#F0ECE2] flex justify-end">
                        <button
                          onClick={() => setCancellingOrder(order)}
                          className="py-1.5 px-3 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Order Dialog Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#DBD5C5] shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-serif text-lg font-bold">Cancel Order #{cancellingOrder.orderNumber}</h3>
            </div>
            <p className="text-xs text-[#52615D]">
              Only pending or confirmed orders can be cancelled. Online payments are not currently verified or refunded automatically.
            </p>
            <div>
              <label className="block text-xs font-semibold text-[#17372F] mb-1">
                Reason for cancellation (optional):
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed my mind / ordered incorrect quantity"
                className="w-full bg-[#FAF8F5] border border-[#DBD5C5] rounded-xl p-2.5 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="py-2 px-4 rounded-xl border border-[#DBD5C5] text-xs font-semibold text-[#17372F]"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelSubmit}
                disabled={cancelLoading}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
