import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { Product, Review } from '../types';
import { ProductCard } from '../components/ProductCard';
import { resolveProductImage } from '../components/ProductCard';
import { Star, ShoppingBag, Zap, Check, ArrowLeft, ShieldCheck, Truck, RefreshCw, Send, User } from 'lucide-react';

export const ProductDetailsPage: React.FC = () => {
  const { selectedProductId, setSelectedProductId, setActivePage, addToCart, showToast, user } = useShop();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'ingredients' | 'benefits' | 'reviews'>('description');

  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState(user?.name || '');
  const [reviewEmail, setReviewEmail] = useState(user?.email || '');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!selectedProductId) return;
      setLoading(true);
      try {
        const prod = await api.getProductById(selectedProductId);
        setProduct(prod);
        
        // Load reviews and related products
        const [revs, allProds] = await Promise.all([
          api.getReviews(prod.id),
          api.getProducts({ category: prod.category }),
        ]);
        setReviews(revs);
        setRelatedProducts(allProds.filter(p => p.id !== prod.id).slice(0, 3));
      } catch (err) {
        console.error('Failed to load product details', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [selectedProductId]);

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center text-xs text-[#6A7B74]">
        Loading product details...
      </div>
    );
  }

  const discountPercentage = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    setActivePage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const newReview = await api.addReview({
        productId: product.id,
        customerName: reviewName || 'Anonymous Customer',
        customerEmail: reviewEmail,
        rating: reviewRating,
        comment: reviewComment,
      });

      setReviews(prev => [newReview, ...prev]);
      setReviewComment('');
      showToast('Thank you! Your verified review has been submitted.');
    } catch (err) {
      showToast('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-[#6A7B74]">
        <button
          onClick={() => setActivePage('shop')}
          className="flex items-center gap-1 text-[#173F35] font-semibold hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Shop</span>
        </button>
        <span aria-hidden="true">/</span>
        <span>{product.category}</span>
        <span aria-hidden="true">/</span>
        <span className="text-[#17372F] font-medium truncate max-w-[200px]">{product.name}</span>
      </div>

      {/* Main Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        
        {/* Left Column: Media Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-[#F2EEE4] border border-[#E7E2D6] shadow-sm">
            <img
              src={resolveProductImage(product.images[activeImageIndex] || product.images[0])}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    activeImageIndex === idx ? 'border-[#173F35] shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={resolveProductImage(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Value Guarantee */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#E7E2D6] text-center text-xs text-[#52615D]">
            <div className="p-3 bg-white rounded-xl border border-[#E7E2D6]">
              <Truck className="w-4 h-4 text-[#173F35] mx-auto mb-1" />
              <p className="font-semibold text-[#17372F]">Fast Dispatch</p>
              <span className="text-[10px] text-[#7A8A84]">Within 24 hours</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E7E2D6]">
              <ShieldCheck className="w-4 h-4 text-[#173F35] mx-auto mb-1" />
              <p className="font-semibold text-[#17372F]">100% Genuine</p>
              <span className="text-[10px] text-[#7A8A84]">Direct from maker</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#E7E2D6]">
              <RefreshCw className="w-4 h-4 text-[#173F35] mx-auto mb-1" />
              <p className="font-semibold text-[#17372F]">Easy Support</p>
              <span className="text-[10px] text-[#7A8A84]">WhatsApp & Phone</span>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Purchase Details */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#6A7B74] mb-2">
              <span className="uppercase tracking-wider font-semibold text-[#173F35]">
                {product.category}
              </span>
              <span aria-hidden="true">·</span>
              <span>{product.weight || 'Standard Size'}</span>
              <span aria-hidden="true">·</span>
              <span className={product.stock > 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                {product.stock > 0 ? `${product.stock} Units In Stock` : 'Out of Stock'}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#17372F] leading-tight">
              {product.name}
            </h1>

            {/* Rating Stars & Count */}
            <div className="flex items-center gap-2 mt-2.5 text-xs">
              <div className="flex items-center text-[#B9944A]">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? 'fill-[#B9944A] text-[#B9944A]'
                        : 'text-[#DBD5C5]'
                    }`}
                  />
                ))}
                <span className="font-bold ml-1.5 text-sm text-[#17372F] tabular-nums">{product.rating}</span>
              </div>
              <span className="text-[#7A8A84]">·</span>
              <button
                onClick={() => setActiveTab('reviews')}
                className="text-[#173F35] font-medium hover:underline cursor-pointer"
              >
                {reviews.length} Customer Reviews
              </button>
            </div>

            {/* Price Box */}
            <div className="flex items-baseline gap-3 mt-4 pt-3 border-t border-[#E7E2D6]">
              <span className="font-serif text-3xl font-bold text-[#17372F] tabular-nums">
                ₹{product.discountPrice || product.price}
              </span>
              {product.discountPrice && (
                <>
                  <span className="text-base text-[#8A9690] line-through tabular-nums">
                    ₹{product.price}
                  </span>
                  <span className="text-xs font-bold bg-[#B9944A] text-[#112F28] px-2 py-0.5 rounded shadow-xs">
                    {discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-[#7A8A84] mt-1">Inclusive of all taxes. Free shipping on orders over ₹499.</p>
          </div>

          <p className="text-xs sm:text-sm text-[#4C5E58] leading-relaxed">
            {product.description}
          </p>

          {/* Available Quantity & Actions */}
          <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#DBD5C5] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#17372F]">Select Quantity</p>
                <p className="text-[11px] text-[#6A7B74]">
                  {product.stock > 0 ? `Max ${product.stock} per customer` : 'Currently unavailable'}
                </p>
              </div>

              <div className="flex items-center border border-[#DBD5C5] rounded-xl bg-white overflow-hidden shadow-xs">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={product.stock <= 0}
                  className="px-3.5 py-1.5 text-sm font-semibold text-[#17372F] hover:bg-[#FAF8F5] disabled:opacity-40 cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-xs font-bold text-[#17372F] tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  disabled={product.stock <= 0 || quantity >= product.stock}
                  className="px-3.5 py-1.5 text-sm font-semibold text-[#17372F] hover:bg-[#FAF8F5] disabled:opacity-40 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#173F35] text-[#173F35] font-bold text-xs hover:bg-[#EAF2EC] disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#173F35] text-white font-bold text-xs hover:bg-[#235D4E] disabled:opacity-40 transition-colors shadow-md cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>

          {/* Quick bullet benefits */}
          {product.benefits && product.benefits.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#17372F]">Formulation Highlights</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[#4C5E58]">
                    <Check className="w-3.5 h-3.5 text-[#173F35] mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Tabs Section: Description, Ingredients, Benefits, Customer Reviews */}
      <div className="pt-8 border-t border-[#E7E2D6]">
        {/* Tab Headers */}
        <div className="flex border-b border-[#E7E2D6] gap-6 text-xs sm:text-sm font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'description'
                ? 'border-[#173F35] text-[#173F35]'
                : 'border-transparent text-[#6A7B74] hover:text-[#17372F]'
            }`}
          >
            Description & Usage
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'ingredients'
                ? 'border-[#173F35] text-[#173F35]'
                : 'border-transparent text-[#6A7B74] hover:text-[#17372F]'
            }`}
          >
            Ingredients Transparency
          </button>
          <button
            onClick={() => setActiveTab('benefits')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'benefits'
                ? 'border-[#173F35] text-[#173F35]'
                : 'border-transparent text-[#6A7B74] hover:text-[#17372F]'
            }`}
          >
            Key Benefits
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'border-[#173F35] text-[#173F35]'
                : 'border-transparent text-[#6A7B74] hover:text-[#17372F]'
            }`}
          >
            Customer Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="py-6">
          {activeTab === 'description' && (
            <div className="max-w-2xl space-y-4 text-xs sm:text-sm text-[#4C5E58] leading-relaxed">
              <p>{product.description}</p>
              {product.usage && (
                <div className="p-4 bg-white rounded-xl border border-[#E7E2D6]">
                  <h4 className="font-bold text-[#17372F] mb-1">Recommended Usage:</h4>
                  <p>{product.usage}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ingredients' && (
            <div className="max-w-2xl space-y-4">
              <p className="text-xs text-[#6A7B74]">
                At VIVEPANYA, transparency is our core standard. Every ingredient is carefully selected for natural safety and effectiveness.
              </p>
              {product.ingredients && product.ingredients.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {product.ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#E7E2D6] text-xs font-medium text-[#2C4039]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#173F35]" />
                      <span>{ing}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#6A7B74]">Pure botanical ingredients and natural essential oils.</p>
              )}
            </div>
          )}

          {activeTab === 'benefits' && (
            <div className="max-w-2xl space-y-3">
              {product.benefits?.map((b, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-[#E7E2D6] text-xs sm:text-sm text-[#4C5E58]">
                  <Check className="w-4 h-4 text-[#173F35] shrink-0 mt-0.5" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* Write Review Form */}
              <div className="bg-white p-6 rounded-2xl border border-[#E7E2D6] max-w-2xl">
                <h3 className="font-serif text-lg font-bold text-[#17372F] mb-1">Write a Review</h3>
                <p className="text-xs text-[#6A7B74] mb-4">Share your personal experience with this product.</p>

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {/* Rating Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-[#17372F] mb-1">Your Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= reviewRating
                                ? 'fill-[#B9944A] text-[#B9944A]'
                                : 'text-[#DBD5C5]'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#17372F] mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="e.g. Priya S."
                        className="w-full bg-[#FAF8F5] border border-[#DBD5C5] rounded-xl py-2 px-3 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#17372F] mb-1">Your Email</label>
                      <input
                        type="email"
                        value={reviewEmail}
                        onChange={(e) => setReviewEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full bg-[#FAF8F5] border border-[#DBD5C5] rounded-xl py-2 px-3 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17372F] mb-1">Your Review</label>
                    <textarea
                      required
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="How did the fragrance, lather, or texture feel?"
                      className="w-full bg-[#FAF8F5] border border-[#DBD5C5] rounded-xl p-3 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="inline-flex items-center gap-2 py-2 px-4 bg-[#173F35] text-white text-xs font-semibold rounded-xl hover:bg-[#235D4E] disabled:opacity-60 transition-colors shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingReview ? 'Posting...' : 'Submit Review'}</span>
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-4 max-w-2xl">
                {reviews.length === 0 ? (
                  <p className="text-xs text-[#6A7B74]">No reviews yet. Be the first to share your experience!</p>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-white rounded-2xl border border-[#E7E2D6] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#EAF2EC] flex items-center justify-center text-[#173F35]">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-[#17372F]">{rev.customerName}</span>
                            {rev.verifiedPurchase && (
                              <span className="ml-2 text-[10px] text-emerald-700 font-semibold">
                                ✓ Verified Buyer
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex text-[#B9944A]">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'fill-[#B9944A]' : 'text-[#DBD5C5]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-[#4C5E58] leading-relaxed pl-9">
                        {rev.comment}
                      </p>

                      <div className="pl-9 text-[10px] text-[#8A9690] tabular-nums">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <div className="pt-8 border-t border-[#E7E2D6]">
          <h2 className="font-serif text-2xl font-bold text-[#17372F] mb-6">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
