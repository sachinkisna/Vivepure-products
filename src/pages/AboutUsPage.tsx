import React from 'react';
import { ViveLogo } from '../components/ViveLogo';
import { resolveProductImage } from '../components/ProductCard';
import { useShop } from '../context/ShopContext';
import { ShieldCheck, Sparkles, HeartHandshake, Leaf, ArrowRight, Award, Compass, Users } from 'lucide-react';

export const AboutUsPage: React.FC = () => {
  const { setActivePage } = useShop();

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      
      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-[#F2ECE1] to-[#FAF8F5] py-16 sm:py-24 border-b border-[#E7E2D6]">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <div className="flex justify-center mb-2">
            <ViveLogo size="lg" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#173F35]">
            Our Heritage & Story
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#17372F] tracking-tight leading-tight">
            Quality. Affordability. <br />
            <span className="italic font-normal text-[#235D4E]">Healthy Living.</span>
          </h1>
          <p className="text-sm sm:text-base text-[#52615D] leading-relaxed max-w-2xl mx-auto pt-2">
            VIVEPANYA E-mart Private Ltd. is an Indian personal care and wellness company dedicated to making authentic, artisan cold-processed herbal products honest and accessible for every household.
          </p>
        </div>
      </section>

      {/* Main Philosophy & Brand Mission */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-5">
            <span className="text-xs font-bold uppercase tracking-widest text-[#173F35]">
              The VIVEPANYA Difference
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#17372F] leading-tight">
              Honoring Ancient Herbal Wisdom with Modern Purity
            </h2>
            <p className="text-xs sm:text-sm text-[#4C5E58] leading-relaxed">
              We started VIVEPANYA with a simple realization: everyday personal care had become dominated by petroleum byproducts, artificial foaming detergents, and synthetic fragrances masked under exorbitant marketing budgets.
            </p>
            <p className="text-xs sm:text-sm text-[#4C5E58] leading-relaxed">
              Our master artisans formulate every batch by hand. Our soaps undergo a traditional 30-day cold-process cure, preserving the naturally occurring skin-softening glycerin that industrial manufacturers strip away. Our coconut oil is extracted purely by centrifugal cold extraction from fresh coconut milk without heating or refining.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E7E2D6]">
              <div>
                <p className="font-serif text-2xl font-bold text-[#17372F] tabular-nums">30 Days</p>
                <p className="text-xs text-[#7A8A84]">Artisan slow cold cure</p>
              </div>
              <div>
                <p className="font-serif text-2xl font-bold text-[#17372F] tabular-nums">0%</p>
                <p className="text-xs text-[#7A8A84]">Parabens, sulfates & SLS</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[4/3] bg-[#EAE5D8] border border-[#DBD5C5]">
              <img
                src={resolveProductImage('/src/assets/images/hero_handcrafted_skincare_1790230406036.jpg')}
                alt="VIVEPANYA Workshop and Botanical Ingredients"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>
      </section>

      {/* The 3 Core Pillars Section */}
      <section className="bg-[#FAF8F5] py-16 border-y border-[#E7E2D6]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="font-serif text-3xl font-bold text-[#17372F]">Our Three Guiding Pillars</h2>
            <p className="text-xs text-[#6A7B74] mt-2">
              Every decision at VIVEPANYA is anchored in these three commitments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-[#E7E2D6] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF2EC] flex items-center justify-center text-[#173F35]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#17372F]">1. Quality in Craft</h3>
              <p className="text-xs text-[#52615D] leading-relaxed">
                Raw cold-pressed botanical oils, authentic Ayurvedic herbs like Neem, Tulsi, Sandalwood and Vetiver, blended in small precision batches for uncompromising skin nutrition.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-[#E7E2D6] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F6EEDC] flex items-center justify-center text-[#B9944A]">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#17372F]">2. Fair Affordability</h3>
              <p className="text-xs text-[#52615D] leading-relaxed">
                We believe wellness must be practical for everyday living. By keeping our manufacturing and distribution efficient, we deliver artisanal standard products at honest, reasonable price points.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-[#E7E2D6] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF2EC] flex items-center justify-center text-[#173F35]">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#17372F]">3. Healthy Living</h3>
              <p className="text-xs text-[#52615D] leading-relaxed">
                Nourishing choices for your family, safe for waterways and gentle on the planet. Biodegradable bars, recyclable bottles, and minimal plastic footprint.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Center & Operations */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="font-serif text-3xl font-bold text-[#17372F]">Corporate Center & Research</h2>
        <p className="text-xs sm:text-sm text-[#52615D] max-w-2xl mx-auto leading-relaxed">
          Headquartered in Bengaluru, Karnataka, our modern formulating laboratory and artisanal processing center combine age-old saponification techniques with stringent microbiological safety testing.
        </p>

        <div className="pt-4">
          <button
            onClick={() => setActivePage('shop')}
            className="inline-flex items-center gap-2 py-3 px-6 bg-[#173F35] text-white text-xs font-bold rounded-xl hover:bg-[#235D4E] transition-colors shadow-sm cursor-pointer"
          >
            <span>Explore Handcrafted Products</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

    </div>
  );
};
