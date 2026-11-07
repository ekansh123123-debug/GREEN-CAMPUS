import React from 'react';
import { Leaf, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white text-slate-600 text-xs py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-campus-700 flex items-center justify-center text-white">
              <Leaf className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-800">GREEN CAMPUS</span>
            <span className="text-slate-400">|</span>
            <span>D. Y. Patil College of Engineering, Akurdi, Pune</span>
          </div>

          <div className="flex items-center gap-6 text-slate-500 text-center sm:text-right">
            <span>B.Tech AI & DS Academic Project (V1)</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-campus-700" />
              Role-Based Access Control
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-[11px]">
          <p>
            V1 Operational Scope: Facility Issue Reporting, Verified Peer Resource Exchange, and Database-Computed Operational Analytics.
          </p>
          <p>Excludes simulated ecological claims, online payment gateways, and automated AI classifiers.</p>
        </div>
      </div>
    </footer>
  );
}
