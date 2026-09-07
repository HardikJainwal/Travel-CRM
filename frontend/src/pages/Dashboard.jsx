import React, { useState, useEffect } from 'react';
import {
  Users,
  Sparkles,
  CalendarCheck,
  AlertCircle,
  PhoneCall,
  Heart,
  FileText,
  CheckCircle2,
  XCircle,
  TrendingUp,
  IndianRupee,
  Filter,
  BarChart,
  PieChart as PieIcon,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart as ReBarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

const PIE_COLORS = ['#2563eb', '#0284c7', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [range, setRange] = useState('30d');
  const [stats, setStats] = useState(null);
  const [sources, setSources] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [trends, setTrends] = useState([]);
  const [teamPerf, setTeamPerf] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, sourcesRes, pipelineRes, trendsRes, teamRes] = await Promise.all([
        api.get(`/dashboard/stats?range=${range}`),
        api.get(`/dashboard/sources?range=${range}`),
        api.get(`/dashboard/pipeline?range=${range}`),
        api.get(`/dashboard/trends?range=${range}`),
        isAdmin ? api.get(`/dashboard/team-performance`) : Promise.resolve({ data: { success: false } }),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (sourcesRes.data.success) setSources(sourcesRes.data.data);
      if (pipelineRes.data.success) setPipeline(pipelineRes.data.data);
      if (trendsRes.data.success) setTrends(trendsRes.data.data);
      if (teamRes.data?.success) setTeamPerf(teamRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [range]);

  const kpiCards = [
    { title: 'Total Leads', value: stats?.totalLeads || 0, icon: Users, color: 'bg-blue-50/60 border-blue-200 text-blue-700' },
    { title: 'New Leads', value: stats?.newLeads || 0, icon: Sparkles, color: 'bg-sky-50/60 border-sky-200 text-sky-700' },
    { title: "Today's Follow-ups", value: stats?.todaysFollowups || 0, icon: CalendarCheck, color: 'bg-amber-50/60 border-amber-200 text-amber-800' },
    { title: 'Overdue Follow-ups', value: stats?.overdueFollowups || 0, icon: AlertCircle, color: 'bg-rose-50/60 border-rose-200 text-rose-700' },
    { title: 'Contacted Leads', value: stats?.contactedLeads || 0, icon: PhoneCall, color: 'bg-purple-50/60 border-purple-200 text-purple-700' },
    { title: 'Interested Leads', value: stats?.interestedLeads || 0, icon: Heart, color: 'bg-pink-50/60 border-pink-200 text-pink-700' },
    { title: 'Quotes Sent', value: stats?.quotesSent || 0, icon: FileText, color: 'bg-teal-50/60 border-teal-200 text-teal-700' },
    { title: 'Confirmed Bookings', value: stats?.bookings || 0, icon: CheckCircle2, color: 'bg-emerald-50/60 border-emerald-200 text-emerald-700' },
    { title: 'Lost Leads', value: stats?.lostLeads || 0, icon: XCircle, color: 'bg-slate-100 border-slate-200 text-slate-600' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Date Range Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Sales & Leads Overview</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Live Agency CRM
            </span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">Real-time Meta Ads & WhatsApp conversion pipeline</p>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: 'this_month', label: 'This Month' },
            { id: 'all', label: 'All Time' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setRange(item.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                range === item.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={fetchDashboardData}
            title="Refresh Stats"
            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Revenue & Conversion Hero Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 p-6 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <IndianRupee className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Booking Revenue</p>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2">{formatCurrency(stats?.totalBookingValue)}</h2>
          <p className="text-xs text-slate-500 mt-2">Avg Deal Size: <span className="text-slate-800 font-bold">{formatCurrency(stats?.avgBookingValue)}</span></p>
        </div>

        <div className="bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 p-6 rounded-2xl border border-blue-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Conversion Rate</p>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2">{stats?.conversionRate || 0}%</h2>
          <p className="text-xs text-slate-500 mt-2">Booked Leads / Total Enquiries</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50/80 via-white to-purple-50/30 p-6 rounded-2xl border border-purple-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Total Pipeline Volume</p>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2">{stats?.totalLeads || 0} Enquiries</h2>
          <p className="text-xs text-slate-500 mt-2">{stats?.newLeads || 0} awaiting initial response</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-9 gap-3">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${card.color} shadow-2xs flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600 truncate">{card.title}</span>
                <Icon className="w-4 h-4 shrink-0" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-600" />
              <span>Lead Sources Breakdown</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Meta / WhatsApp / Web</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sources}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ _id, percent }) => `${_id} (${(percent * 100).toFixed(0)}%)`}
                >
                  {sources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Pipeline Funnel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart className="w-4 h-4 text-emerald-600" />
              <span>Sales Pipeline Breakdown</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Stage Progress</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={pipeline} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="status" stroke="#64748b" fontSize={10} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily Lead Trend */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span>Daily Lead Acquisition & Booking Trend</span>
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="_id" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', color: '#0f172a', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
              <Area type="monotone" dataKey="leads" stroke="#2563eb" fillOpacity={1} fill="url(#colorLeads)" name="Total Leads" />
              <Area type="monotone" dataKey="bookings" stroke="#10b981" fillOpacity={1} fill="url(#colorBookings)" name="Confirmed Bookings" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Admin Team Leaderboard */}
      {isAdmin && teamPerf.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span>Team Performance Leaderboard (Amit & Hardik)</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Team Member</th>
                  <th className="p-3">Assigned Leads</th>
                  <th className="p-3">Contacted</th>
                  <th className="p-3">Follow-ups Done</th>
                  <th className="p-3">Bookings</th>
                  <th className="p-3">Conversion Rate</th>
                  <th className="p-3">Booking Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {teamPerf.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                        {member.name.charAt(0)}
                      </div>
                      <span>{member.name}</span>
                    </td>
                    <td className="p-3 font-medium">{member.assignedLeads}</td>
                    <td className="p-3 font-medium">{member.contactedLeads}</td>
                    <td className="p-3 font-medium">{member.completedFollowups}</td>
                    <td className="p-3 font-bold text-emerald-700">{member.bookings}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                        {member.conversionRate}%
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">{formatCurrency(member.bookingValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
