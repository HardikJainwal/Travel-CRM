import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Compass,
  IndianRupee,
  Users,
  Target,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import api from '../services/api';

export default function Analytics() {
  const [sources, setSources] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [teamPerf, setTeamPerf] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [srcRes, pipeRes, teamRes] = await Promise.all([
          api.get('/dashboard/sources?range=all'),
          api.get('/dashboard/pipeline?range=all'),
          api.get('/dashboard/team-performance').catch(() => ({ data: { success: false } })),
        ]);

        if (srcRes.data.success) setSources(srcRes.data.data);
        if (pipeRes.data.success) setPipeline(pipeRes.data.data);
        if (teamRes.data?.success) setTeamPerf(teamRes.data.data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campaign & Sales Analytics</h1>
        <p className="text-xs text-slate-500">Insights into Meta Facebook Ads, Indian tour enquiries, and conversion ROI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meta Ads & Sources Performance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>Lead Sources Volume & Conversion</span>
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sources}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="_id" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="count" fill="#2563eb" name="Total Enquiries" radius={[6, 6, 0, 0]} />
                <Bar dataKey="bookings" fill="#10b981" name="Bookings" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span>Pipeline Conversion Stages</span>
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipeline} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="status" type="category" stroke="#64748b" fontSize={10} width={110} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
