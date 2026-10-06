import { resolveProductImage } from '../components/ProductCard';
import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { Category } from '../types';
import { ArrowRight, Sparkles } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const { setSelectedCategory, setActivePage } = useShop();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getCategories();
        setCategories(data);
      } catch (e) {
        console.error('Failed to load categories', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSelect = (catName: string) => {
    setSelectedCategory(catName);
    setActivePage('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-[#173F35]">
          Explore Our Range
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#17372F] mt-2">
          Product Categories
        </h1>
        <p className="text-xs sm:text-sm text-[#5B6D66] mt-2 max-w-lg mx-auto">
          From daily cold-processed bathing bars to restorative virgin coconut oil and curated festive gift packs.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs text-[#7A8A84]">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleSelect(cat.name)}
              className="group bg-white rounded-3xl border border-[#E7E2D6] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col sm:flex-row"
            >
              <div className="sm:w-1/2 aspect-[4/3] sm:aspect-auto overflow-hidden bg-[#F2EEE4] relative">
                <img
                 src={resolveProductImage(cat.image)}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="sm:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#B9944A]">
                    {cat.itemCount || 3} Formulations
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-[#17372F] group-hover:text-[#173F35] transition-colors mt-1">
                    {cat.name}
                  </h2>
                  <p className="text-xs text-[#52615D] mt-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-[#173F35] pt-2">
                  <span>Browse Category</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
