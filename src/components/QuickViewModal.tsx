import React, { useState } from 'react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';
import { resolveProductImage } from './ProductCard';
import { X, Star, ShoppingBag, Zap, Check, ArrowRight } from 'lucide-react';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose }) => {
  const { addToCart, setActivePage, setSelectedProductId } = useShop();
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onClose();
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    onClose();
    setActivePage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFullDetails = () => {
    setSelectedProductId(product.id);
    setActivePage('product-details');
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-[#FAF8F5] rounded-3xl border border-[#DBD5C5] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full text-[#17372F] shadow-sm transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Media Column */}
        <div className="md:w-1/2 bg-[#F2EEE4] p-6 flex flex-col justify-between">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white shadow-inner">
            <img
              src={resolveProductImage(product.images[activeImageIndex] || product.images[0])}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto py-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIndex === idx ? 'border-[#173F35] scale-105' : 'border-transparent opacity-70'
                  }`}
                >
                  <img
                    src={resolveProductImage(img)}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Column */}
        <div className="md:w-1/2 p-6 md:p-8 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#6A7B74] mb-2">
              <span className="uppercase tracking-wider font-semibold text-[#173F35]">
                {product.category}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums font-medium text-emerald-700">
                {product.stock > 0 ? `${product.stock} Units In Stock` : 'Out of stock'}
              </span>
            </div>

            <h2 className="font-serif text-2xl font-bold text-[#17372F] leading-tight">
              {product.name}
            </h2>

            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center text-[#B9944A]">
                <Star className="w-4 h-4 fill-[#B9944A]" />
                <span className="font-bold ml-1 text-sm text-[#17372F]">{product.rating}</span>
              </div>
              <span className="text-xs text-[#7A8A84]">({product.reviewCount} customer reviews)</span>
            </div>

            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-2xl font-bold text-[#17372F] tabular-nums">
                ₹{product.discountPrice || product.price}
              </span>
              {product.discountPrice && (
                <span className="text-sm text-[#8A9690] line-through tabular-nums">
                  ₹{product.price}
                </span>
              )}
            </div>

            <p className="text-xs text-[#52615D] mt-3 leading-relaxed">
              {product.description}
            </p>

            {product.benefits && product.benefits.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <p className="text-xs font-semibold text-[#17372F]">Key Highlights:</p>
                {product.benefits.slice(0, 3).map((b, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[#52615D]">
                    <Check className="w-3.5 h-3.5 text-[#173F35] mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#E7E2D6] space-y-3">
            {/* Quantity Selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#17372F]">Quantity:</span>
              <div className="flex items-center border border-[#DBD5C5] rounded-xl bg-white overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3 py-1 text-sm text-[#17372F] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  -
                </button>
                <span className="px-3 py-1 text-xs font-bold text-[#17372F] tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  className="px-3 py-1 text-sm text-[#17372F] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-[#173F35] text-[#173F35] font-semibold text-xs hover:bg-[#EAF2EC] transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#173F35] text-white font-semibold text-xs hover:bg-[#235D4E] transition-colors cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now</span>
              </button>
            </div>

            <button
              onClick={handleFullDetails}
              className="w-full text-center text-xs font-medium text-[#173F35] hover:underline flex items-center justify-center gap-1 pt-1 cursor-pointer"
            >
              <span>View complete product details & reviews</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
