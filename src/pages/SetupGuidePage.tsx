import React from 'react';
import { Terminal, Database, Shield, Play, CheckCircle2, Copy } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const SetupGuidePage: React.FC = () => {
  const { showToast } = useShop();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Command copied to clipboard');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      
      <div className="border-b border-[#E7E2D6] pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-[#173F35]">
          Documentation & Manual
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#17372F] mt-1">
          Full-Stack & MongoDB Setup Instructions
        </h1>
        <p className="text-xs sm:text-sm text-[#52615D] mt-1">
          Step-by-step developer and administrator guide to configure dependencies, MongoDB, Express REST API, and production deployment.
        </p>
      </div>

      {/* 1. Admin Credentials Box */}
      <div className="bg-[#173F35] text-white p-6 sm:p-8 rounded-3xl shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-[#B9944A]">
          <Shield className="w-5 h-5" />
          <h2 className="font-serif text-xl font-bold text-white">Default Admin & Demo Credentials</h2>
        </div>
        <p className="text-xs text-[#CADAD5]">
          The database is pre-seeded with administrator and customer accounts for immediate testing:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-xs space-y-1">
            <span className="font-bold text-[#B9944A] uppercase text-[10px]">Administrator Access</span>
            <p className="text-white"><strong className="text-emerald-300">Email:</strong> admin@vivepanya.com</p>
            <p className="text-white"><strong className="text-emerald-300">Password:</strong> admin123</p>
            <p className="text-[11px] text-[#A3B8B0] pt-1">Unlocks full stock control, order status advancement, and product creation.</p>
          </div>

          <div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-xs space-y-1">
            <span className="font-bold text-[#B9944A] uppercase text-[10px]">Customer Access</span>
            <p className="text-white"><strong className="text-emerald-300">Email:</strong> customer@vivepanya.com</p>
            <p className="text-white"><strong className="text-emerald-300">Password:</strong> password123</p>
            <p className="text-[11px] text-[#A3B8B0] pt-1">Has existing order history (VP-2026-1001) for order tracking testing.</p>
          </div>
        </div>
      </div>

      {/* 2. Step 1: Dependencies */}
      <div className="bg-white rounded-3xl border border-[#E7E2D6] p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-[#173F35]">
          <Terminal className="w-5 h-5" />
          <h3 className="font-serif text-xl font-bold text-[#17372F]">1. Installing Dependencies</h3>
        </div>
        <p className="text-xs text-[#52615D] leading-relaxed">
          Clone or open the repository in terminal and install all frontend & backend dependencies:
        </p>
        <div className="relative bg-[#1A2522] text-[#A3E6D0] p-4 rounded-2xl font-mono text-xs overflow-x-auto">
          <code>npm install</code>
          <button
            onClick={() => copyToClipboard('npm install')}
            className="absolute right-3 top-3 text-[#A3E6D0] hover:text-white"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Step 2: MongoDB Setup */}
      <div className="bg-white rounded-3xl border border-[#E7E2D6] p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-[#173F35]">
          <Database className="w-5 h-5" />
          <h3 className="font-serif text-xl font-bold text-[#17372F]">2. Setting Up MongoDB (Local or Atlas)</h3>
        </div>
        <p className="text-xs text-[#52615D] leading-relaxed">
          The development server can start while MongoDB is temporarily unavailable, but data-backed API requests require a reachable MongoDB database.
        </p>
        <ul className="text-xs text-[#52615D] space-y-2 list-disc list-inside">
          <li><strong>MongoDB Atlas:</strong> Create a <code>.env</code> file and set <code>MONGODB_URI</code>. Ensure your Atlas cluster is running and your current IP address is allowed in Network Access.</li>
        </ul>

        <div className="relative bg-[#1A2522] text-[#A3E6D0] p-4 rounded-2xl font-mono text-xs overflow-x-auto space-y-1">
          <p># In .env</p>
          <p>PORT=3000</p>
          <p>JWT_SECRET="vivepanya_jwt_super_secret_production_key_2026"</p>
          <p>MONGODB_URI="mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.mongodb.net/vivepanya_emart?retryWrites=true&w=majority"</p>
          <button
            onClick={() => copyToClipboard('MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/vivepanya_emart?retryWrites=true&w=majority"')}
            className="absolute right-3 top-3 text-[#A3E6D0] hover:text-white"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#52615D]">
          To start a local MongoDB instance with Docker or system service:
        </p>
        <div className="relative bg-[#1A2522] text-[#A3E6D0] p-3 rounded-xl font-mono text-xs overflow-x-auto">
          <code>docker run -d -p 27017:27017 --name mongodb-vivepanya mongo:latest</code>
        </div>
      </div>

      {/* 4. Step 3 & 4: Starting backend & frontend */}
      <div className="bg-white rounded-3xl border border-[#E7E2D6] p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-[#173F35]">
          <Play className="w-5 h-5" />
          <h3 className="font-serif text-xl font-bold text-[#17372F]">3. Running the Complete Application</h3>
        </div>
        <p className="text-xs text-[#52615D] leading-relaxed">
          The development stack runs Express.js and Vite together on Port 3000 using <code>tsx server.ts</code>:
        </p>

        <div className="relative bg-[#1A2522] text-[#A3E6D0] p-4 rounded-2xl font-mono text-xs overflow-x-auto space-y-2">
          <p># Development mode (starts Express backend + Vite client middleware on port 3000)</p>
          <code>npm run dev</code>
        </div>

        <p className="text-xs text-[#52615D] leading-relaxed pt-2">
          For production building and deployment:
        </p>

        <div className="relative bg-[#1A2522] text-[#A3E6D0] p-4 rounded-2xl font-mono text-xs overflow-x-auto space-y-2">
          <p># 1. Build client bundle</p>
          <code>npm run build</code>
          <p className="pt-2"># 2. Start production server</p>
          <code>npm run start</code>
        </div>
      </div>

      {/* 5. REST API Architecture Summary */}
      <div className="bg-white rounded-3xl border border-[#E7E2D6] p-6 sm:p-8 space-y-4 shadow-xs">
        <h3 className="font-serif text-xl font-bold text-[#17372F]">REST API Endpoints Reference</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#DBD5C5]">
            <span className="font-mono font-bold text-[#173F35]">GET /api/products</span>
            <p className="text-[#6A7B74] mt-0.5">Filter by category, search term, min/max price, rating</p>
          </div>
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#DBD5C5]">
            <span className="font-mono font-bold text-[#173F35]">POST /api/orders</span>
            <p className="text-[#6A7B74] mt-0.5">Creates new order, auto-generates Order ID, calculates totals</p>
          </div>
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#DBD5C5]">
            <span className="font-mono font-bold text-[#173F35]">PUT /api/orders/:id/status</span>
            <p className="text-[#6A7B74] mt-0.5">Admin order lifecycle update (Pending to Delivered)</p>
          </div>
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#DBD5C5]">
            <span className="font-mono font-bold text-[#173F35]">POST /api/auth/login</span>
            <p className="text-[#6A7B74] mt-0.5">Issues JWT token and returns user profile role</p>
          </div>
        </div>
      </div>

    </div>
  );
};
