import React, { useState } from 'react';
import { Product } from '../types';
import { useShop } from '../context/ShopContext';
import { Star, ShoppingBag, Eye, Zap, Sparkles } from 'lucide-react';

const bundledImages = import.meta.glob<string>('../assets/images/*', {
  eager: true,
  query: '?url',
  import: 'default',
});

export const resolveProductImage = (imagePath: string): string => {
  const localImagePrefix = '/src/assets/images/';
  if (!imagePath.startsWith(localImagePrefix)) {
    return imagePath;
  }

  const imageFile = imagePath.slice(localImagePrefix.length);
  console.log(
    'IMAGE:',
    imagePath,
    '→',
    bundledImages[`../assets/images/${imageFile}`]
  );
  return bundledImages[`../assets/images/${imageFile}`] ?? imagePath;
};

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { addToCart, setActivePage, setSelectedProductId } = useShop();
  const [imageError, setImageError] = useState(false);

  const discountPercentage = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleCardClick = () => {
    setSelectedProductId(product.id);
    setActivePage('product-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setActivePage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <article
      onClick={handleCardClick}
      className="group bg-white rounded-2xl border border-[#E7E2D6] overflow-hidden flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div>
        {/* Product Media Area */}
        <div className="relative aspect-[4/3] bg-[#F5F2EB] overflow-hidden">
          {!imageError && product.images && product.images[0] ? (
            <img
              src={resolveProductImage(product.images[0])}
              alt={product.name}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            // Styled Resilient Botanical Fallback
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#EAF0EC] to-[#F7F4EC] p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#173F35]/10 flex items-center justify-center text-[#173F35] mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-xs font-serif font-bold text-[#173F35]">{product.name}</span>
              <span className="text-[10px] text-[#6A7B74] mt-0.5">{product.category}</span>
            </div>
          )}

          {/* Tag Badges - Clean minimal text flags */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
            {discountPercentage > 0 && (
              <span className="bg-[#B9944A] text-[#112F28] font-bold text-[11px] px-2 py-0.5 rounded shadow-sm">
                {discountPercentage}% OFF
              </span>
            )}
            {product.isBestSeller && (
              <span className="bg-[#173F35] text-white font-medium text-[10px] px-2 py-0.5 rounded shadow-sm">
                Best Seller
              </span>
            )}
            {product.isNewArrival && !product.isBestSeller && (
              <span className="bg-white/90 text-[#173F35] font-semibold text-[10px] px-2 py-0.5 rounded border border-[#DBD5C5] shadow-sm">
                New Arrival
              </span>
            )}
          </div>

          {/* Quick View Button Hover */}
          {onQuickView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="absolute bottom-2.5 right-2.5 p-2 bg-white/90 hover:bg-white text-[#173F35] rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              title="Quick view"
              aria-label="Quick view product"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Details */}
        <div className="p-4 sm:p-5">
          {/* Metadata line without pill enclosure */}
          <div className="flex items-center gap-1.5 text-xs text-[#6A7B74] mb-1.5">
            <span className="uppercase tracking-wider font-semibold text-[10px] text-[#173F35]">
              {product.category}
            </span>
            <span aria-hidden="true">·</span>
            <span>{product.weight || 'Standard'}</span>
            <span aria-hidden="true">·</span>
            <span className={product.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-serif text-lg font-bold text-[#17372F] line-clamp-1 leading-snug group-hover:text-[#173F35] transition-colors">
            {product.name}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-[#52615D] line-clamp-2 mt-1 min-h-[32px] leading-relaxed">
            {product.description}
          </p>

          {/* Rating & Reviews */}
          <div className="flex items-center gap-1.5 mt-2.5 text-xs">
            <div className="flex items-center text-[#B9944A]">
              <Star className="w-3.5 h-3.5 fill-[#B9944A] text-[#B9944A]" />
              <span className="font-semibold ml-1 text-[#17372F] tabular-nums">{product.rating}</span>
            </div>
            <span className="text-[#84948E] text-[11px] tabular-nums">
              ({product.reviewCount} reviews)
            </span>
          </div>

          {/* Price Layout */}
          <div className="flex items-baseline gap-2 mt-3 pt-2 border-t border-[#F0ECE2]">
            <span className="text-lg font-bold text-[#17372F] tabular-nums">
              ₹{product.discountPrice || product.price}
            </span>
            {product.discountPrice && (
              <span className="text-xs text-[#8A9690] line-through tabular-nums">
                ₹{product.price}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 pt-0 grid grid-cols-2 gap-2">
        <button
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
          className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl border border-[#173F35] text-[#173F35] bg-[#FAF8F5] hover:bg-[#EAF2EC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
        >
          <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
          <span>Add to Cart</span>
        </button>

        <button
          onClick={handleBuyNow}
          disabled={product.stock <= 0}
          className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-[#173F35] text-white hover:bg-[#235D4E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer shadow-sm"
        >
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <span>Buy Now</span>
        </button>
      </div>
    </article>
  );
};
