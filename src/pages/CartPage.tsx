import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { resolveProductImage } from '../components/ProductCard';
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShoppingBag, Tag, Check, Sparkles } from 'lucide-react';

export const CartPage: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    deliveryCharges,
    cartTotal,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
    setActivePage,
  } = useShop();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    if (!couponInput.trim()) return;

    const res = applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponInput('');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#EAF2EC] text-[#173F35] flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#17372F]">Your Cart is Empty</h1>
        <p className="text-xs text-[#6A7B74] mt-2 max-w-sm mx-auto">
          Explore our handcrafted herbal soaps, cold-pressed virgin coconut oil, and artisanal gifting collections.
        </p>
        <button
          onClick={() => {
            setActivePage('shop');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="mt-6 inline-flex items-center gap-2 py-3 px-6 bg-[#173F35] text-white text-xs font-bold rounded-xl hover:bg-[#235D4E] transition-colors shadow-sm cursor-pointer"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="border-b border-[#E7E2D6] pb-4 mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#17372F]">Shopping Cart</h1>
          <p className="text-xs text-[#6A7B74] mt-0.5">
            You have {cart.reduce((sum, i) => sum + i.quantity, 0)} item(s) in your bag
          </p>
        </div>
        <button
          onClick={() => setActivePage('shop')}
          className="text-xs font-semibold text-[#173F35] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map(({ product, quantity }) => {
            const unitPrice = product.discountPrice || product.price;
            const lineTotal = unitPrice * quantity;

            return (
              <div
                key={product.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E7E2D6] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Product info */}
                <div className="flex items-center gap-4">
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#F2EEE4] shrink-0">
                    <img
                      src={resolveProductImage(product.images[0])}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#173F35] tracking-wider">
                      {product.category}
                    </span>
                    <h3 className="font-serif text-base font-bold text-[#17372F] leading-snug">
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xs font-bold text-[#17372F] tabular-nums">
                        ₹{unitPrice}
                      </span>
                      {product.discountPrice && (
                        <span className="text-[10px] text-[#8A9690] line-through tabular-nums">
                          ₹{product.price}
                        </span>
                      )}
                      <span className="text-[11px] text-[#7A8A84]">· {product.weight || '125g'}</span>
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center justify-between w-full sm:w-auto gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#F0ECE2]">
                  {/* Stepper */}
                  <div className="flex items-center border border-[#DBD5C5] rounded-xl bg-[#FAF8F5] overflow-hidden">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="p-1.5 text-[#17372F] hover:bg-white cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-[#17372F] tabular-nums">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      disabled={quantity >= product.stock}
                      className="p-1.5 text-[#17372F] hover:bg-white disabled:opacity-40 cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right min-w-[70px]">
                    <span className="font-serif text-base font-bold text-[#17372F] tabular-nums">
                      ₹{lineTotal}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="p-2 text-[#8A9690] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Order Summary & Coupon */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Summary Box */}
          <div className="bg-white p-6 rounded-2xl border border-[#E7E2D6] shadow-xs space-y-4">
            <h2 className="font-serif text-xl font-bold text-[#17372F] pb-3 border-b border-[#F0ECE2]">
              Order Summary
            </h2>

            <div className="space-y-2.5 text-xs text-[#52615D]">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-[#17372F] tabular-nums">₹{cartSubtotal}</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="font-semibold tabular-nums text-[#17372F]">
                  {deliveryCharges === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    `₹${deliveryCharges}`
                  )}
                </span>
              </div>

              {cartSubtotal < 500 && (
                <div className="p-2.5 rounded-xl bg-[#EAF2EC] text-[11px] text-[#173F35]">
                  Add <strong>₹{500 - cartSubtotal}</strong> more to qualify for <strong>FREE Delivery</strong>!
                </div>
              )}

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                  <span>Coupon Discount ({appliedCoupon})</span>
                  <span className="tabular-nums">-₹{discountAmount}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-[#F0ECE2] flex justify-between items-baseline">
              <div>
                <span className="text-xs font-semibold text-[#17372F]">Grand Total</span>
                <p className="text-[10px] text-[#7A8A84]">Inclusive of all taxes</p>
              </div>
              <span className="font-serif text-2xl font-bold text-[#17372F] tabular-nums">
                ₹{cartTotal}
              </span>
            </div>

            {/* Checkout Action */}
            <button
              onClick={() => {
                setActivePage('checkout');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-3 px-4 bg-[#173F35] text-white text-xs font-bold rounded-xl hover:bg-[#235D4E] transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Coupon Code Section */}
          <div className="bg-white p-5 rounded-2xl border border-[#E7E2D6] shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#17372F] mb-2">
              <Tag className="w-3.5 h-3.5 text-[#173F35]" />
              <span>Apply Discount Coupon</span>
            </div>

            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold">{appliedCoupon} Applied</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter code (e.g. VIVE10)"
                    className="flex-1 bg-[#FAF8F5] border border-[#DBD5C5] rounded-xl py-2 px-3 text-xs text-[#1E2E2A] uppercase focus:outline-none focus:border-[#173F35]"
                  />
                  <button
                    type="submit"
                    className="py-2 px-3 bg-[#FAF8F5] border border-[#173F35] text-[#173F35] text-xs font-bold rounded-xl hover:bg-[#EAF2EC] transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-[11px] text-rose-600">{couponError}</p>
                )}
                <div className="flex gap-2 text-[10px] text-[#6A7B74] pt-1">
                  <span>Try:</span>
                  <button
                    type="button"
                    onClick={() => applyCoupon('VIVE10')}
                    className="font-mono text-[#173F35] font-semibold underline cursor-pointer"
                  >
                    VIVE10
                  </button>
                  <span>or</span>
                  <button
                    type="button"
                    onClick={() => applyCoupon('WELCOME20')}
                    className="font-mono text-[#173F35] font-semibold underline cursor-pointer"
                  >
                    WELCOME20
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
