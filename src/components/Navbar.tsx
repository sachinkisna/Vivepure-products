import React, { useState } from 'react';
import { ViveLogo } from './ViveLogo';
import { AdminDashboardTab, useShop } from '../context/ShopContext';
import { ShoppingBag, Search, User as UserIcon, Menu, X } from 'lucide-react';

type AuthMode = 'login' | 'register';

export const Navbar: React.FC<{ onOpenAuth: (mode?: AuthMode) => void }> = ({ onOpenAuth }) => {
  const {
    activePage,
    setActivePage,
    cartCount,
    user,
    logout,
    setAdminDashboardTab,
    searchQuery,
    setSearchQuery,
    setSelectedCategory,
  } = useShop();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleNavClick = (page: string, category: string = 'All') => {
    setSelectedCategory(category);
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminNav = (tab: AdminDashboardTab) => {
    setAdminDashboardTab(tab);
    handleNavClick('admin');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActivePage('shop');
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E7E2D6] transition-all">
      {/* Top micro-announcement banner */}
      <div className="bg-[#173F35] text-white text-[12px] font-medium tracking-wide py-1.5 px-4 text-center">
        <span>Free Shipping Across India on Orders Above ₹499 · Pure · Handcrafted · Sustainable</span>
      </div>

      {/* Main Navigation (3-Zone Top Bar Contract) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-18 flex items-center justify-between gap-4">
          
          {/* ZONE 1: Brand title & Emblem */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center text-left focus:outline-none group cursor-pointer"
            aria-label="VIVEPANYA Home"
          >
            <ViveLogo size="md" />
          </button>

          {/* ZONE 2: 4-6 Clean Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-[14px] font-medium text-[#2C4039]">
            <button
              onClick={() => handleNavClick('home')}
              className={`transition-colors py-1 cursor-pointer ${
                activePage === 'home'
                  ? 'text-[#173F35] font-semibold border-b-2 border-[#173F35]'
                  : 'hover:text-[#173F35]'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('shop')}
              className={`transition-colors py-1 cursor-pointer ${
                activePage === 'shop'
                  ? 'text-[#173F35] font-semibold border-b-2 border-[#173F35]'
                  : 'hover:text-[#173F35]'
              }`}
            >
              Shop All
            </button>
            <button
              onClick={() => handleNavClick('categories')}
              className={`transition-colors py-1 cursor-pointer ${
                activePage === 'categories'
                  ? 'text-[#173F35] font-semibold border-b-2 border-[#173F35]'
                  : 'hover:text-[#173F35]'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => handleNavClick('orders')}
              className={`transition-colors py-1 cursor-pointer ${
                activePage === 'orders'
                  ? 'text-[#173F35] font-semibold border-b-2 border-[#173F35]'
                  : 'hover:text-[#173F35]'
              }`}
            >
              My Orders
            </button>
            <button
              onClick={() => handleNavClick('about')}
              className={`transition-colors py-1 cursor-pointer ${
                activePage === 'about'
                  ? 'text-[#173F35] font-semibold border-b-2 border-[#173F35]'
                  : 'hover:text-[#173F35]'
              }`}
            >
              About Us
            </button>
            <button
              onClick={() => handleNavClick('contact')}
              className={`transition-colors py-1 cursor-pointer ${
                activePage === 'contact'
                  ? 'text-[#173F35] font-semibold border-b-2 border-[#173F35]'
                  : 'hover:text-[#173F35]'
              }`}
            >
              Contact Us
            </button>
          </nav>

          {/* ZONE 3: 1-2 Primary Actions & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Search Input / Expand */}
            <form onSubmit={handleSearchSubmit} className="relative hidden md:flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search herbal soaps, oils..."
                className="w-48 lg:w-60 bg-white/80 border border-[#DBD5C5] rounded-full py-1.5 pl-3.5 pr-8 text-xs text-[#1E2E2A] placeholder:text-[#8A9690] focus:outline-none focus:border-[#173F35] focus:bg-white transition-all"
              />
              <button
                type="submit"
                className="absolute right-2.5 text-[#647C74] hover:text-[#173F35] cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-2 text-[#2C4039] hover:text-[#173F35] cursor-pointer"
              aria-label="Toggle search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* User Account / Auth */}
            {user ? (
              <div className="relative group">
                <button
                  onClick={() => user.role === 'admin' ? handleAdminNav('overview') : handleNavClick('orders')}
                  className="flex items-center gap-1.5 text-xs font-medium py-1.5 px-2.5 rounded-lg bg-white border border-[#DBD5C5] text-[#1E2E2A] hover:border-[#173F35] cursor-pointer"
                  aria-label={user.role === 'admin' ? 'Open admin dashboard menu' : 'Open my orders'}
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#173F35]" />
                  <span className="hidden sm:inline max-w-[85px] truncate">{user.name.split(' ')[0]}</span>
                </button>
                <div className="absolute right-0 top-full hidden group-hover:block group-focus-within:block z-50 pt-1">
                  <div className="w-56 bg-white border border-[#E7E2D6] rounded-xl shadow-lg py-1.5">
                    <div className="px-3 py-1.5 border-b border-[#F0EBE0] text-xs">
                      <p className="font-semibold text-[#1E2E2A] truncate">{user.name}</p>
                      <p className="text-[#7A8A84] truncate">{user.email}</p>
                    </div>
                    {user.role === 'admin' ? (
                      <>
                        <button onClick={() => handleAdminNav('overview')} className="w-full text-left px-3 py-1.5 text-xs text-[#2C4039] hover:bg-[#FAF8F5] cursor-pointer">
                          Admin Dashboard
                        </button>
                        <button onClick={() => handleAdminNav('products')} className="w-full text-left px-3 py-1.5 text-xs text-[#2C4039] hover:bg-[#FAF8F5] cursor-pointer">
                          Products Management
                        </button>
                        <button onClick={() => handleAdminNav('orders')} className="w-full text-left px-3 py-1.5 text-xs text-[#2C4039] hover:bg-[#FAF8F5] cursor-pointer">
                          Orders &amp; Tracking
                        </button>
                        <button onClick={() => handleAdminNav('categories')} className="w-full text-left px-3 py-1.5 text-xs text-[#2C4039] hover:bg-[#FAF8F5] cursor-pointer">
                          Categories Management
                        </button>
                        <button onClick={() => handleAdminNav('reviews')} className="w-full text-left px-3 py-1.5 text-xs text-[#2C4039] hover:bg-[#FAF8F5] cursor-pointer">
                          Reviews Approval
                        </button>
                        <button onClick={() => handleAdminNav('customers')} className="w-full text-left px-3 py-1.5 text-xs text-[#2C4039] hover:bg-[#FAF8F5] cursor-pointer">
                          Customers
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleNavClick('orders')}
                        className="w-full text-left px-3 py-1.5 text-xs text-[#2C4039] hover:bg-[#FAF8F5] cursor-pointer"
                      >
                        My Orders
                      </button>
                    )}
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg bg-white border border-[#DBD5C5] text-[#1E2E2A] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#173F35]" />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg bg-[#173F35] text-white hover:bg-[#235D4E] transition-colors cursor-pointer"
                >
                  Register
                </button>
              </>
            )}

            {/* Shopping Cart Button with Counter */}
            <button
              onClick={() => handleNavClick('cart')}
              className="relative p-2 text-[#1E2E2A] hover:text-[#173F35] transition-colors cursor-pointer"
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-[#B9944A] text-[#112F28] font-bold text-[10px] flex items-center justify-center tabular-nums shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#2C4039] hover:text-[#173F35] cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        {searchOpen && (
          <div className="md:hidden py-2 pb-3 border-t border-[#E7E2D6]">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search herbal soaps, oils, combos..."
                className="w-full bg-white border border-[#DBD5C5] rounded-xl py-2 pl-3.5 pr-9 text-xs text-[#1E2E2A] focus:outline-none focus:border-[#173F35]"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-3 top-2.5 text-[#647C74]"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E7E2D6] bg-[#FAF8F5] px-4 pt-3 pb-6 space-y-2.5 shadow-xl">
          <button
            onClick={() => handleNavClick('home')}
            className={`block w-full text-left py-2 text-sm font-medium ${
              activePage === 'home' ? 'text-[#173F35] font-bold' : 'text-[#2C4039]'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNavClick('shop')}
            className={`block w-full text-left py-2 text-sm font-medium ${
              activePage === 'shop' ? 'text-[#173F35] font-bold' : 'text-[#2C4039]'
            }`}
          >
            Shop All Products
          </button>
          <button
            onClick={() => handleNavClick('categories')}
            className={`block w-full text-left py-2 text-sm font-medium ${
              activePage === 'categories' ? 'text-[#173F35] font-bold' : 'text-[#2C4039]'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => handleNavClick('orders')}
            className={`block w-full text-left py-2 text-sm font-medium ${
              activePage === 'orders' ? 'text-[#173F35] font-bold' : 'text-[#2C4039]'
            }`}
          >
            My Orders
          </button>
          <button
            onClick={() => handleNavClick('about')}
            className={`block w-full text-left py-2 text-sm font-medium ${
              activePage === 'about' ? 'text-[#173F35] font-bold' : 'text-[#2C4039]'
            }`}
          >
            About Us
          </button>
          <button
            onClick={() => handleNavClick('contact')}
            className={`block w-full text-left py-2 text-sm font-medium ${
              activePage === 'contact' ? 'text-[#173F35] font-bold' : 'text-[#2C4039]'
            }`}
          >
            Contact Us
          </button>
          {user?.role === 'admin' && (
            <div className="border-t border-[#E7E2D6] pt-2 mt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A8A84] pb-1">Admin</p>
              <button onClick={() => handleAdminNav('overview')} className="block w-full text-left py-2 text-sm font-medium text-[#2C4039]">
                Admin Dashboard
              </button>
              <button onClick={() => handleAdminNav('products')} className="block w-full text-left py-2 text-sm font-medium text-[#2C4039]">
                Products Management
              </button>
              <button onClick={() => handleAdminNav('orders')} className="block w-full text-left py-2 text-sm font-medium text-[#2C4039]">
                Orders &amp; Tracking
              </button>
              <button onClick={() => handleAdminNav('categories')} className="block w-full text-left py-2 text-sm font-medium text-[#2C4039]">
                Categories Management
              </button>
              <button onClick={() => handleAdminNav('reviews')} className="block w-full text-left py-2 text-sm font-medium text-[#2C4039]">
                Reviews Approval
              </button>
              <button onClick={() => handleAdminNav('customers')} className="block w-full text-left py-2 text-sm font-medium text-[#2C4039]">
                Customers
              </button>
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-sm font-medium text-rose-600">
                Sign Out
              </button>
            </div>
          )}
          {!user && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { onOpenAuth('login'); setMobileMenuOpen(false); }}
                className="flex-1 py-2 rounded-lg border border-[#DBD5C5] text-sm font-semibold text-[#173F35]"
              >
                Login
              </button>
              <button
                onClick={() => { onOpenAuth('register'); setMobileMenuOpen(false); }}
                className="flex-1 py-2 rounded-lg bg-[#173F35] text-sm font-semibold text-white"
              >
                Register
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
