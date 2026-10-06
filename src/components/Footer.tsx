import React from 'react';
import { ViveLogo } from './ViveLogo';
import { useShop } from '../context/ShopContext';
import { MapPin, Phone, Mail, Clock, ArrowRight, ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';

type AuthMode = 'login' | 'register';

export const Footer: React.FC<{ onOpenAuth: (mode?: AuthMode) => void }> = ({ onOpenAuth }) => {
  const { setActivePage, setSelectedCategory, user } = useShop();

  const handleNav = (page: string, cat?: string) => {
    if (cat) setSelectedCategory(cat);
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#112F28] text-[#C9D7D2] pt-16 pb-12 border-t border-[#1C4239]">
      {/* Trust Badges Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 mb-12 border-b border-white/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-[#B9944A] mb-2.5">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="text-white font-semibold text-xs tracking-wide">100% Ayurvedic & Pure</h4>
            <p className="text-[11px] text-[#9FB3AC] mt-0.5">Cold-processed botanical formulations</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-[#B9944A] mb-2.5">
              <Truck className="w-5 h-5" />
            </div>
            <h4 className="text-white font-semibold text-xs tracking-wide">Pan-India Express Delivery</h4>
            <p className="text-[11px] text-[#9FB3AC] mt-0.5">Free delivery on orders over ₹499</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-[#B9944A] mb-2.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-white font-semibold text-xs tracking-wide">Secure Checkout</h4>
            <p className="text-[11px] text-[#9FB3AC] mt-0.5">Cash on Delivery & Instant UPI / Card</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-[#B9944A] mb-2.5">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h4 className="text-white font-semibold text-xs tracking-wide">Dedicated Support</h4>
            <p className="text-[11px] text-[#9FB3AC] mt-0.5">Retail, bulk & customer care</p>
          </div>
        </div>
      </div>

      {/* Main Footer Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <ViveLogo size="lg" inverted={true} />
            <p className="text-xs text-[#9EB3AC] leading-relaxed max-w-sm">
              VIVEPANYA E-mart Private Ltd. is an Indian company focused on the manufacture and marketing of pure health, cosmetic and personal-care products. Quality in what we make, affordability in what we offer, and healthy living in what we inspire.
            </p>
            <div className="space-y-2 text-xs text-[#9EB3AC] pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#B9944A] shrink-0" />
                <span>VIVEPANYA Corporate Centre, Bengaluru, Karnataka, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#B9944A] shrink-0" />
                <span>+91 98450 12345 / +91 80 4123 5678</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#B9944A] shrink-0" />
                <span>care@vivepanya.com · orders@vivepanya.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#B9944A] shrink-0" />
                <span>Mon – Sat: 9:30 AM – 6:30 PM IST</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider font-sans">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => handleNav('home')} className="hover:text-white transition-colors cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('shop')} className="hover:text-white transition-colors cursor-pointer">
                  Shop All Products
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('categories')} className="hover:text-white transition-colors cursor-pointer">
                  Collections & Categories
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('orders')} className="hover:text-white transition-colors cursor-pointer">
                  Track My Order
                </button>
              </li>
              {!user && (
                <>
                  <li>
                    <button onClick={() => onOpenAuth('login')} className="hover:text-white transition-colors cursor-pointer">
                      User Login
                    </button>
                  </li>
                  <li>
                    <button onClick={() => onOpenAuth('register')} className="hover:text-white transition-colors cursor-pointer">
                      Register
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Product Categories */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider font-sans">
              Collections
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => handleNav('shop', 'Handmade Soaps')} className="hover:text-white transition-colors cursor-pointer">
                  Handmade Herbal Soaps
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('shop', 'Virgin Coconut Oil')} className="hover:text-white transition-colors cursor-pointer">
                  Cold-Pressed Virgin Coconut Oil
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('shop', 'Special Care & Detox')} className="hover:text-white transition-colors cursor-pointer">
                  Detox & Pigmentation Care
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('shop', 'Combos & Gift Packs')} className="hover:text-white transition-colors cursor-pointer">
                  Festive & Corporate Gift Boxes
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('about')} className="hover:text-white transition-colors cursor-pointer">
                  Ayurvedic Quality Philosophy
                </button>
              </li>
            </ul>
          </div>

          {/* Business & Partners */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider font-sans">
              Business Opportunities
            </h4>
            <p className="text-xs text-[#9EB3AC] leading-relaxed">
              We welcome wholesale, distributor, supermarket, and corporate gifting partnerships across India and abroad.
            </p>
            <div className="pt-2">
              <button
                onClick={() => handleNav('contact')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white/10 hover:bg-white text-white hover:text-[#112F28] transition-colors cursor-pointer"
              >
                <span>Partner With Us</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#829990]">
          <p>© {new Date().getFullYear()} VIVEPANYA E-mart Private Ltd. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Privacy Policy</span>
            <span>·</span>
            <span>Terms of Service</span>
            <span>·</span>
            <span>Shipping Policy</span>
            <span>·</span>
            <span>Returns & Refunds</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
