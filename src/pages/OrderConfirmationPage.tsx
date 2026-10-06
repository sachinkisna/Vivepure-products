import React, { useEffect, useState } from 'react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { Order } from '../types';
import { ViveLogo } from '../components/ViveLogo';
import { CheckCircle2, Package, Truck, Printer, ArrowRight, Clock } from 'lucide-react';

export const OrderConfirmationPage: React.FC = () => {
  const { lastPlacedOrderId, setActivePage } = useShop();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!lastPlacedOrderId) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getOrderById(lastPlacedOrderId);
        setOrder(data);
      } catch (err) {
        console.error('Failed to load confirmed order', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [lastPlacedOrderId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-xs text-[#6A7B74]">
        Retrieving order confirmation...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-[#17372F]">No Recent Order Found</h2>
        <p className="text-xs text-[#6A7B74] mt-2 mb-6">You can check your order history anytime.</p>
        <button
          onClick={() => setActivePage('orders')}
          className="py-2 px-5 bg-[#173F35] text-white text-xs font-semibold rounded-xl"
        >
          View My Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      
      {/* Success Hero Header */}
      <div className="bg-[#FAF8F5] border border-[#DBD5C5] rounded-3xl p-8 sm:p-10 text-center shadow-sm relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-[#173F35]">
          Order Confirmed
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#17372F] mt-1">
          Thank you for choosing VIVEPANYA!
        </h1>
        <p className="text-xs sm:text-sm text-[#52615D] mt-2 max-w-md mx-auto">
          Your order has been recorded. View its latest status from your account.
        </p>

        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-[#DBD5C5] text-xs">
          <span className="text-[#6A7B74]">Order ID:</span>
          <span className="font-mono font-bold text-[#17372F] text-sm tabular-nums">
            {order.orderNumber}
          </span>
          <span className="text-[#DBD5C5]">|</span>
          <span className="text-[#6A7B74]">Payment:</span>
          <span className="font-semibold text-[#173F35]">{order.paymentMethod}</span>
          <span className="text-[#DBD5C5]">|</span>
          <span className="text-[#6A7B74]">Status:</span>
          <span className="font-semibold text-emerald-700">{order.status}</span>
        </div>
      </div>

      {/* Printable Receipt / Invoice Container */}
      <div className="bg-white rounded-3xl border border-[#E7E2D6] p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Receipt Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-[#F0ECE2] gap-4">
          <ViveLogo size="md" />
          <div className="text-left sm:text-right text-xs text-[#6A7B74]">
            <p className="font-bold text-[#17372F]">TAX INVOICE / RECEIPT</p>
            <p className="tabular-nums">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
            <p className="tabular-nums">Time: {new Date(order.createdAt).toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Addresses & Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-[#52615D]">
          <div>
            <h4 className="font-bold text-[#17372F] mb-1.5 uppercase tracking-wider text-[11px]">
              Delivery Destination
            </h4>
            <p className="font-semibold text-[#17372F]">{order.deliveryAddress.name}</p>
            <p>{order.deliveryAddress.address}</p>
            <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
            <p className="mt-1">Phone: {order.deliveryAddress.phone}</p>
            <p>Email: {order.deliveryAddress.email}</p>
          </div>

          <div>
            <h4 className="font-bold text-[#17372F] mb-1.5 uppercase tracking-wider text-[11px]">
              Order Information
            </h4>
            <p><span className="text-[#7A8A84]">Order Reference:</span> {order.orderNumber}</p>
            <p><span className="text-[#7A8A84]">Payment Method:</span> {order.paymentMethod}</p>
            <p><span className="text-[#7A8A84]">Payment Status:</span> {order.paymentStatus}</p>
            <p><span className="text-[#7A8A84]">Estimated Delivery:</span> 3 - 5 Business Days</p>
          </div>
        </div>

        {/* Ordered Items Table */}
        <div className="border border-[#E7E2D6] rounded-2xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF8F5] border-b border-[#E7E2D6] text-[#17372F]">
              <tr>
                <th className="py-3 px-4 font-semibold">Item</th>
                <th className="py-3 px-4 font-semibold text-center">Qty</th>
                <th className="py-3 px-4 font-semibold text-right">Price</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE2] text-[#4C5E58]">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-[#17372F]">{item.name}</p>
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums">{item.quantity}</td>
                  <td className="py-3 px-4 text-right tabular-nums">₹{item.price}</td>
                  <td className="py-3 px-4 text-right font-semibold text-[#17372F] tabular-nums">
                    ₹{item.price * item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Breakdown */}
        <div className="flex justify-end pt-2 text-xs">
          <div className="w-full sm:w-64 space-y-2 text-[#52615D]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-[#17372F] tabular-nums">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee:</span>
              <span className="font-semibold text-[#17372F] tabular-nums">
                {order.deliveryCharges === 0 ? 'FREE' : `₹${order.deliveryCharges}`}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span className="tabular-nums">-₹{order.discount}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-[#F0ECE2] text-sm font-bold text-[#17372F]">
              <span>Total Paid/Due:</span>
              <span className="tabular-nums font-serif text-lg">₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-[#F0ECE2]">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl border border-[#DBD5C5] text-xs font-semibold text-[#17372F] hover:bg-[#FAF8F5] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Invoice</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActivePage('orders')}
              className="py-2.5 px-4 rounded-xl bg-[#FAF8F5] border border-[#173F35] text-[#173F35] text-xs font-semibold hover:bg-[#EAF2EC] cursor-pointer"
            >
              Track Order Status
            </button>

            <button
              onClick={() => setActivePage('shop')}
              className="py-2.5 px-5 rounded-xl bg-[#173F35] text-white text-xs font-bold hover:bg-[#235D4E] flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
