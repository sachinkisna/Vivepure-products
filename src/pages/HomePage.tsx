import { resolveProductImage } from '../components/ProductCard';
import React, { useState, useEffect } from 'react';
import { ProductCard } from '../components/ProductCard';
import { QuickViewModal } from '../components/QuickViewModal';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { Product, Category } from '../types';
import { Sparkles, ArrowRight, ShieldCheck, HeartHandshake, Leaf, Star, CheckCircle, Package } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { setActivePage, setSelectedCategory, addToCart } = useShop();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodData, catData] = await Promise.all([
          api.getProducts(),
          api.getCategories(),
        ]);
        setProducts(prodData);
        setCategories(catData);
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 4);
  const bestSellers = products.filter(p => p.isBestSeller).slice(0, 4);
  const newArrivals = products.filter(p => p.isNewArrival).slice(0, 4);

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setActivePage('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F2ECE1] via-[#FAF7F0] to-[#FAF8F5] pt-10 pb-16 md:py-20 border-b border-[#E7E2D6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#173F35]/10 text-[#173F35] text-xs font-semibold">
                <Leaf className="w-3.5 h-3.5" />
                <span>Thoughtfully Made for Everyday Care</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#17372F] tracking-tight leading-[1.08] text-balance">
                Naturally Crafted. <br />
                <span className="italic font-normal text-[#235D4E]">Thoughtfully Made.</span>
              </h1>

              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-wide text-[#735A22]">
                <span>Quality</span>
                <span aria-hidden="true">·</span>
                <span>Affordability</span>
                <span aria-hidden="true">·</span>
                <span>Healthy Living</span>
              </div>

              <p className="text-sm sm:text-base text-[#4C5E58] leading-relaxed max-w-xl">
                Discover artisan cold-processed herbal soaps, pure cold-pressed virgin coconut oil, and clarifying detox treatments formulated with natural botanicals for your daily wellness.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setActivePage('shop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-[#173F35] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-[#235D4E] transition-all shadow-md cursor-pointer"
                >
                  <span>Explore Shop</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setSelectedCategory('Combos & Gift Packs');
                    setActivePage('shop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-white border border-[#DBD5C5] text-[#17372F] text-xs sm:text-sm font-bold rounded-xl hover:bg-[#F5F2EB] transition-colors cursor-pointer"
                >
                  <span>Gift & Combos</span>
                </button>
              </div>

              {/* Proof Metric Adjacency */}
              <div className="pt-4 border-t border-[#E7E2D6] flex items-center gap-8 text-xs text-[#5A6E67]">
                <div>
                  <p className="font-serif text-xl font-bold text-[#17372F] tabular-nums">10,000+</p>
                  <p className="text-[11px] text-[#7A8C85]">Happy Customers</p>
                </div>
                <div className="h-8 w-px bg-[#DBD5C5]" />
                <div>
                  <p className="font-serif text-xl font-bold text-[#17372F] tabular-nums">4.9 / 5.0</p>
                  <p className="text-[11px] text-[#7A8C85]">Customer Rating</p>
                </div>
                <div className="h-8 w-px bg-[#DBD5C5]" />
                <div>
                  <p className="font-serif text-xl font-bold text-[#17372F] tabular-nums">100%</p>
                  <p className="text-[11px] text-[#7A8C85]">Ayurvedic Formulation</p>
                </div>
              </div>
            </div>

            {/* Right Media Hero Visual */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80 aspect-[16/9] lg:aspect-[4/3] bg-[#EAE5D8]">
                <img
                  src={resolveProductImage('/src/assets/images/hero_handcrafted_skincare_1790230406036.jpg')}
                  alt="VIVEPANYA Handcrafted Soaps and Virgin Coconut Oil"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-white/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#173F35]">Signature Collection</span>
                    <h3 className="font-serif text-sm font-bold text-[#17372F]">Virgin Coconut Oil & Artisan Soaps</h3>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setActivePage('shop');
                    }}
                    className="py-1.5 px-3 bg-[#173F35] text-white text-xs font-semibold rounded-lg hover:bg-[#235D4E] cursor-pointer"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. CATEGORIES OVERVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#173F35]">
              Curated Collections
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#17372F] mt-1">
              Shop by Category
            </h2>
          </div>
          <button
            onClick={() => {
              setActivePage('categories');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-semibold text-[#173F35] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.name)}
              className="group bg-white rounded-2xl border border-[#E7E2D6] overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div className="relative aspect-[4/3] bg-[#EFECE3] overflow-hidden">
                <img
                  src={resolveProductImage(cat.image)}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#17372F] group-hover:text-[#173F35] transition-colors">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] text-[#6A7B74] tabular-nums">
                    {cat.itemCount || 3} items
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#DBD5C5] flex items-center justify-center text-[#173F35] group-hover:bg-[#173F35] group-hover:text-white transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#173F35]">
              Customer Favorites
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#17372F] mt-1">
              Featured Products
            </h2>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setActivePage('shop');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-semibold text-[#173F35] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>View Full Shop</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>
      </section>

      {/* 4. BOTANICAL SPOTLIGHT / PROMOTIONAL PROOF */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#173F35] text-white overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-12">
          
          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-semibold tracking-widest uppercase text-[#B9944A]">
                Spotlight Formulation
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                Pure Cold-Pressed Virgin Coconut Oil
              </h2>
              <p className="text-sm text-[#CADAD5] leading-relaxed max-w-lg">
                Extracted from fresh, mature coconut milk through traditional cold centrifugation. Retains all natural lauric acid, vitamin E, and antioxidant nutrients without heating or artificial fragrances.
              </p>
              
              <ul className="space-y-2 text-xs sm:text-sm text-[#CADAD5] pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#B9944A]" />
                  <span>No mineral oils, silicones, or chemical additives</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#B9944A]" />
                  <span>Nourishing hair scalp massage & deep skin hydration</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#B9944A]" />
                  <span>Zero heating process preserves delicate natural fragrance</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <div>
                <span className="text-xs text-[#9FB5AD] line-through">₹399</span>
                <p className="font-serif text-2xl font-bold text-white tabular-nums">₹349</p>
              </div>
              <button
                onClick={() => {
                  const vco = products.find(p => p.id === 'prod-2');
                  if (vco) {
                    addToCart(vco, 1);
                    setActivePage('checkout');
                  } else {
                    setSelectedCategory('Virgin Coconut Oil');
                    setActivePage('shop');
                  }
                }}
                className="py-3 px-6 bg-[#B9944A] text-[#112F28] font-bold text-xs sm:text-sm rounded-xl hover:bg-[#caa75e] transition-colors shadow-md cursor-pointer"
              >
                Order Coconut Oil Now
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#1F4E42] relative min-h-[300px]">
            <img
              src={resolveProductImage('/src/assets/images/product_virgin_coconut_oil_1790230435872.jpg')}
              alt="Cold-Pressed Virgin Coconut Oil"
              className="w-full h-full object-cover"
            />
          </div>

        </div>
      </section>

      {/* 5. BEST SELLERS & NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#173F35]">
              Top Rated Collections
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#17372F] mt-1">
              Best Sellers & New Arrivals
            </h2>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setActivePage('shop');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xs font-semibold text-[#173F35] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>
      </section>

      {/* 6. THREE PILLARS (WHY VIVEPANYA) */}
      <section className="bg-[#F4EFE6] py-16 border-y border-[#E7E2D6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#173F35]">
              Our Foundation
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#17372F] mt-1">
              Good Products. Fair Prices. Healthier Choices.
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6D66] mt-2">
              Our philosophy guides every batch, from ingredient sourcing to packaging and delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-[#E0D9C8] shadow-xs text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF2EC] flex items-center justify-center text-[#173F35] mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#17372F] mb-2">Quality You Can Trust</h3>
              <p className="text-xs text-[#52615D] leading-relaxed">
                Rigorous adherence to traditional formulations, using cold extraction techniques that preserve botanical nutrients without harsh sulfated surfactants.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-[#E0D9C8] shadow-xs text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-[#F6EEDC] flex items-center justify-center text-[#B9944A] mb-4">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#17372F] mb-2">Affordable by Philosophy</h3>
              <p className="text-xs text-[#52615D] leading-relaxed">
                Wellness should never be an exclusive luxury. We eliminate excessive packaging markups and middlemen to provide high quality at honest, fair prices.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-[#E0D9C8] shadow-xs text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF2EC] flex items-center justify-center text-[#173F35] mb-4">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#17372F] mb-2">Inspired by Healthy Living</h3>
              <p className="text-xs text-[#52615D] leading-relaxed">
                Thoughtfully crafted personal care created to bring the goodness of natural ingredients seamlessly into modern family everyday routines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CUSTOMER REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#173F35]">
            Verified Customer Stories
          </span>
          <h2 className="font-serif text-3xl font-bold text-[#17372F] mt-1">
            Loved by Conscious Shoppers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E7E2D6] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-[#B9944A] mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#B9944A]" />
                ))}
              </div>
              <p className="text-xs text-[#4C5E58] italic leading-relaxed">
                "The Neem & Tulsi soap is genuinely remarkable. My skin usually feels tight and dry after soap bars, but this one creates a rich creamy lather that washes away easily while leaving my face hydrated."
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F0ECE2] flex items-center justify-between text-xs">
              <span className="font-bold text-[#17372F]">Aarav Sharma</span>
              <span className="text-[10px] text-emerald-700 font-medium">Verified Buyer</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E7E2D6] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-[#B9944A] mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#B9944A]" />
                ))}
              </div>
              <p className="text-xs text-[#4C5E58] italic leading-relaxed">
                "Purest virgin coconut oil I have purchased online in India. The mild natural fresh coconut fragrance is unmistakable. I use it for weekly hair scalp massage and overnight skin moisture."
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F0ECE2] flex items-center justify-between text-xs">
              <span className="font-bold text-[#17372F]">Priya Sundaram</span>
              <span className="text-[10px] text-emerald-700 font-medium">Verified Buyer</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E7E2D6] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-[#B9944A] mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#B9944A]" />
                ))}
              </div>
              <p className="text-xs text-[#4C5E58] italic leading-relaxed">
                "Ordered 5 festival gift boxes for our office executives. The wooden soap rest and packaging aesthetic look ultra-luxurious. Everyone loved the natural scents."
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F0ECE2] flex items-center justify-between text-xs">
              <span className="font-bold text-[#17372F]">Kavita Menon</span>
              <span className="text-[10px] text-emerald-700 font-medium">Verified Buyer</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}

    </div>
  );
};
