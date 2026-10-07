import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { resolveProductImage } from '../components/ProductCard';
import { ShieldCheck, Truck, CreditCard, Banknote, ArrowLeft, Check, Lock } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    deliveryCharges,
    discountAmount,
    cartTotal,
    appliedCoupon,
    clearCart,
    user,
    setActivePage,
    setLastPlacedOrderId,
    showToast,
  } = useShop();

  const [loading, setLoading] = useState(false);

  // Delivery details form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: 'Karnataka',
    pincode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'Online Payment'>('Cash on Delivery');

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-[#17372F]">No Items to Checkout</h2>
        <p className="text-xs text-[#6A7B74] mt-1 mb-6">Your shopping bag is empty.</p>
        <button
          onClick={() => setActivePage('shop')}
          className="py-2.5 px-5 bg-[#173F35] text-white text-xs font-semibold rounded-xl hover:bg-[#235D4E] cursor-pointer"
        >
          Browse Products
        </button>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderItems = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const orderPayload = {
        deliveryAddress: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        items: orderItems,
        couponCode: appliedCoupon || undefined,
        paymentMethod,
      };

      const placedOrder = await api.createOrder(orderPayload);
      clearCart();
      setLastPlacedOrderId(placedOrder.id);
      showToast('Order placed successfully!');
      setActivePage('order-confirmation');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      showToast(err?.message || 'Failed to place order. Please verify details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="border-b border-[#E7E2D6] pb-4 mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#17372F]">Checkout</h1>
          <p className="text-xs text-[#6A7B74] mt-0.5">
            Your order details and stock are checked by the server before confirmation.
          </p>
        </div>
        <button
          onClick={() => setActivePage('cart')}
          className="text-xs font-semibold text-[#173F35] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Cart</span>
        </button>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Delivery Details & Payment Selection */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Customer & Delivery Address */}
          <div className="bg-white p-6 rounded-2xl border border-[#E7E2D6] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#F0ECE2]">
              <Truck className="w-4 h-4 text-[#173F35]" />
              <h2 className="font-serif text-lg font-bold text-[#17372F]">
                1. Delivery & Contact Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#17372F] mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Priya Sundaram"
                  className="w-full bg-[#FAF8F5] border border-[#DBD5C5] rounded-xl py-2 px-3 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17372F] mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 98450 12345"
                  className="w-full bg-[#FAF8F5] border border-[#DBD5C5] rounded-xl py-2 px-3 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17372F] mb-1">
                Email Address (for order tracking & invoice) *
              </label>
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="name@example.com"
                className="w-full bg-[#FAF8F5] border border-[#DBD5C5] rounded-xl py-2 px-3 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17372F] mb-1">
                Complete Delivery Address (House / Flat / Street / Landmark) *
              </label>
              <input
                type="text"
                required
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Flat 304, Green Palms, 2nd Cross, Indiranagar"
                className="w-full bg-[#FAF8F5] border border-[#DBD5C5] rounded-xl py-2 px-3 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#17372F] mb-1">City *</label>
                <input
                  type="text"
                  required
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="e.g. Bengaluru"
                  className="w-full bg-[#FAF8F5] border border-[#DBD5C5] rounded-xl py-2 px-3 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17372F] mb-1">State *</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full bg-[#FAF8F5] border border-[#DBD5C5] rounded-xl py-2 px-3 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
                >
                  <option>Karnataka</option>
                  <option>Maharashtra</option>
                  <option>Tamil Nadu</option>
                  <option>Kerala</option>
                  <option>Delhi NCR</option>
                  <option>Telangana</option>
                  <option>Gujarat</option>
                  <option>Rajasthan</option>
                  <option>West Bengal</option>
                  <option>Other State</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#17372F] mb-1">PIN Code *</label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{6}"
                  title="Six digit PIN code"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  placeholder="560038"
                  className="w-full bg-[#FAF8F5] border border-[#DBD5C5] rounded-xl py-2 px-3 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
                />
              </div>
            </div>
          </div>

          {/* 2. Payment Method */}
          <div className="bg-white p-6 rounded-2xl border border-[#E7E2D6] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#F0ECE2]">
              <Lock className="w-4 h-4 text-[#173F35]" />
              <h2 className="font-serif text-lg font-bold text-[#17372F]">
                2. Choose Payment Method
              </h2>
            </div>

            <div className="space-y-3">
              {/* Online Payment Option */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  paymentMethod === 'Online Payment'
                    ? 'border-[#173F35] bg-[#FAF8F5] ring-1 ring-[#173F35]'
                    : 'border-[#DBD5C5] hover:bg-[#FAF8F5]'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'Online Payment'}
                  onChange={() => setPaymentMethod('Online Payment')}
                  className="mt-1 accent-[#173F35]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#17372F] flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#173F35]" />
                      <span>Online Payment</span>
                    </span>
                    <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                      Gateway not connected
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6A7B74] mt-1">
                    No online payment will be collected here. The order will remain unpaid until a payment gateway is integrated and verified by the server.
                  </p>
                </div>
              </label>

              {/* Cash on Delivery Option */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  paymentMethod === 'Cash on Delivery'
                    ? 'border-[#173F35] bg-[#FAF8F5] ring-1 ring-[#173F35]'
                    : 'border-[#DBD5C5] hover:bg-[#FAF8F5]'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'Cash on Delivery'}
                  onChange={() => setPaymentMethod('Cash on Delivery')}
                  className="mt-1 accent-[#173F35]"
                />
                <div>
                  <span className="text-xs font-bold text-[#17372F] flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-[#173F35]" />
                    <span>Cash on Delivery (COD)</span>
                  </span>
                  <p className="text-[11px] text-[#6A7B74] mt-1">
                    Pay with cash or scan delivery partner's QR code when your parcel arrives at your doorstep.
                  </p>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-[#E7E2D6] shadow-xs space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#17372F] pb-3 border-b border-[#F0ECE2]">
              Order Summary ({cart.length} Products)
            </h2>

            {/* Itemized Mini List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={resolveProductImage(product.images[0])}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-lg object-cover bg-[#F2EEE4]"
                    />
                    <div>
                      <p className="font-semibold text-[#17372F] line-clamp-1">{product.name}</p>
                      <span className="text-[11px] text-[#7A8A84] tabular-nums">
                        Qty: {quantity} × ₹{product.discountPrice || product.price}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-[#17372F] tabular-nums">
                    ₹{(product.discountPrice || product.price) * quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="pt-3 border-t border-[#F0ECE2] space-y-2 text-xs text-[#52615D]">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-[#17372F] tabular-nums">₹{cartSubtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="font-semibold text-[#17372F] tabular-nums">
                  {deliveryCharges === 0 ? <span className="text-emerald-700">FREE</span> : `₹${deliveryCharges}`}
                </span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount ({appliedCoupon})</span>
                  <span className="tabular-nums">-₹{discountAmount}</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="pt-3 border-t border-[#F0ECE2] flex justify-between items-baseline">
              <div>
                <span className="text-xs font-semibold text-[#17372F]">Total Payable</span>
                <p className="text-[10px] text-[#7A8A84]">Inclusive of GST</p>
              </div>
              <span className="font-serif text-3xl font-bold text-[#17372F] tabular-nums">
                ₹{cartTotal}
              </span>
            </div>

            {/* Place Order CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#173F35] text-white text-xs font-bold rounded-xl hover:bg-[#235D4E] disabled:opacity-60 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Processing Order...' : `Place Order · ₹${cartTotal}`}</span>
            </button>

            <div className="text-[11px] text-[#7A8A84] text-center pt-1 space-y-1">
              <p>🔒 256-bit SSL Bank-Grade Encryption</p>
              <p>By placing order you agree to VIVEPANYA terms & shipping policy.</p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};
