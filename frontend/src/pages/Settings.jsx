import React from 'react';
import { Settings as SettingsIcon, Database, Shield, Zap, Sparkles, MapPin, Tag } from 'lucide-react';

const INDIAN_SERVICES = [
  { name: 'Manali - Kasol', duration: '4N/5D' },
  { name: 'Manali - Kasol', duration: '5N/6D' },
  { name: 'Yulla Kanda', duration: '4N/5D' },
  { name: 'Udaipur - Mount Abu', duration: '2N/3D' },
  { name: 'Chopta - Tungnath', duration: '4N/5D' },
  { name: 'Madhyamaheshwar', duration: '4N/5D' },
  { name: 'Jibhi - Tirthan', duration: '4N/5D' },
  { name: 'Kasol - Kheerganga', duration: '2N/3D' },
  { name: 'Chakrata - Tigerfall', duration: '1N/2D' },
  { name: 'Char Dham', duration: '10N/11D' },
  { name: 'Do Dham', duration: '4N/5D' },
  { name: 'Mcleodganj - Triund', duration: '2N/3D' },
];

export default function Settings() {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings & Service Catalog</h1>
        <p className="text-xs text-slate-500">Agency travel offerings, dynamic pricing setup, and database infrastructure</p>
      </div>

      {/* Offered Indian Travel Services */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>Offered Indian Travel Services</span>
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            Dynamic Pricing (Price on Request)
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Note: Static package prices are excluded as rate fluctuations occur depending on travel dates, seasonality, and customized travel requests.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
          {INDIAN_SERVICES.map((srv, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 transition shadow-2xs space-y-2"
            >
              <div className="flex items-start justify-between">
                <span className="font-bold text-slate-900 text-xs">{srv.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
                  {srv.duration}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                <span className="flex items-center gap-1 font-medium text-emerald-700">
                  <Tag className="w-3 h-3 text-emerald-600" />
                  <span>Price on Request</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database & Infrastructure */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-sky-700 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span>Database & Agency Infrastructure</span>
          </h2>
          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Database Layer</span>
              <span className="font-bold text-slate-900">MongoDB Atlas (M0 Free Tier)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">ORM / ODM Abstraction</span>
              <span className="font-semibold text-emerald-700">Mongoose ORM</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Primary Admins</span>
              <span className="font-bold text-blue-700">Amit (Main) & Hardik</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Default Currency</span>
              <span className="font-bold text-slate-900">Indian Rupee (₹ INR)</span>
            </div>
          </div>
        </div>

        {/* Future Integrations & Extension Points */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>Future Extension Points</span>
          </h2>
          <ul className="space-y-2.5 text-xs text-slate-700">
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Meta Lead Ads Webhook endpoint (`POST /api/webhooks/meta-leads`)</span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Official WhatsApp Business API integration</span>
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>PDF Itinerary & Quotation Generator for Indian Packages</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
