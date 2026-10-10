import React, { useEffect } from 'react';
import { ArrowRight, Leaf, X } from 'lucide-react';

interface FeaturedProductPopupProps {
  onClose: () => void;
  onExplore: () => void;
}

export const FeaturedProductPopup: React.FC<FeaturedProductPopupProps> = ({
  onClose,
  onExplore,
}) => {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="featured-popup-backdrop fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <section
        aria-labelledby="featured-product-title"
        aria-modal="true"
        className="featured-popup-card relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/70 bg-[#FAF8F5] shadow-2xl"
        onClick={event => event.stopPropagation()}
        role="dialog"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close featured product popup"
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-[#17372F] shadow-md transition hover:rotate-90 hover:bg-white sm:right-4 sm:top-4"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid md:grid-cols-2">
          <div className="relative h-48 overflow-hidden bg-[#EAE5D8] sm:h-64 md:h-full md:min-h-[390px]">
            <img
              src="https://ik.imagekit.io/aiodifydotcom/vivepanya/products/VivePure_Anti-Tan_Herbal_Soap_XPp41O76t.png"
              alt="VivePure Anti-Tan Herbal Soap"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#102D25]/40 via-transparent to-transparent md:bg-gradient-to-r" />
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#173F35] shadow-sm">
              <Leaf className="h-3.5 w-3.5" />
              Featured natural care
            </span>
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A7735]">
              A little care, a natural glow
            </p>
            <h2
              id="featured-product-title"
              className="mt-3 font-serif text-2xl font-bold leading-tight text-[#17372F] sm:text-3xl"
            >
              VivePure Anti-Tan Herbal Soap
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#52615D]">
              Natural skin cleansing and tan care, crafted for your everyday self-care ritual.
            </p>
            <button
              type="button"
              onClick={onExplore}
              className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#173F35] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#173F35]/20 transition duration-300 hover:-translate-y-0.5 hover:bg-[#235D4E] hover:shadow-xl sm:w-auto"
            >
              Explore tan-care products
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 self-center text-xs font-medium text-[#7A8A84] underline decoration-transparent underline-offset-4 transition hover:text-[#173F35] hover:decoration-current sm:self-start"
            >
              Maybe later
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
