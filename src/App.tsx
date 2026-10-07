import React, { useState } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { WhatsAppWidget } from './components/WhatsAppWidget';

// Pages
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { AboutUsPage } from './pages/AboutUsPage';
import { ContactUsPage } from './pages/ContactUsPage';
import { SetupGuidePage } from './pages/SetupGuidePage';
import { AdminDashboard } from './pages/AdminDashboard';
import { CheckCircle2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activePage, toastMessage, user, authLoading, setActivePage, showToast } = useShop();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  React.useEffect(() => {
    if (authLoading) return;
    const customerPages = ['orders', 'checkout', 'order-confirmation'];

    if (activePage === 'admin' && user?.role !== 'admin') {
      setActivePage('home');
      if (!user) setAuthModalOpen(true);
      else showToast('Administrator access is required.');
      return;
    }

    if (customerPages.includes(activePage) && !user) {
      setActivePage('home');
      setAuthModalOpen(true);
    }
  }, [activePage, authLoading, setActivePage, showToast, user]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1E2E2A] selection:bg-[#173F35] selection:text-white">
      {/* Navigation Header */}
      <Navbar onOpenAuth={openAuth} />

      {/* Main Page Content */}
      <main className="flex-1">
        {activePage === 'home' && <HomePage />}
        {activePage === 'shop' && <ShopPage />}
        {activePage === 'product-details' && <ProductDetailsPage />}
        {activePage === 'categories' && <CategoriesPage />}
        {activePage === 'cart' && <CartPage />}
        {activePage === 'checkout' && <CheckoutPage />}
        {activePage === 'order-confirmation' && <OrderConfirmationPage />}
        {activePage === 'orders' && <MyOrdersPage />}
        {activePage === 'about' && <AboutUsPage />}
        {activePage === 'contact' && <ContactUsPage />}
        {activePage === 'guide' && <SetupGuidePage />}
        {activePage === 'admin' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <Footer onOpenAuth={openAuth} />

      {/* WhatsApp Support */}
      <WhatsAppWidget />

      {/* Auth Modal (Login / Register / Demo) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-300 pointer-events-none">
          <div className="bg-[#173F35] text-white py-3 px-4 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-medium border border-white/10">
            <CheckCircle2 className="w-4 h-4 text-[#B9944A] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ShopProvider>
      <AppContent />
    </ShopProvider>
  );
}
