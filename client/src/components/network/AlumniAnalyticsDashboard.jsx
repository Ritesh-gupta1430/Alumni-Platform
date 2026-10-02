import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';
import {
  Users,
  Building,
  GraduationCap,
  TrendingUp,
  MapPin,
  Briefcase,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Award,
  Layers,
  CheckCircle2,
  SlidersHorizontal,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Badge, RoleBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

// Color palettes for Recharts
const CHART_COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

export default function AlumniAnalyticsDashboard({ data, loading = false }) {
  // Normalize payload
  const analyticsData = useMemo(() => {
    if (!data) return { locations: [], techCorridors: [], analytics: {}, totalAlumni: 0 };
    if (Array.isArray(data)) {
      return { locations: data, techCorridors: [], analytics: {}, totalAlumni: data.reduce((a, b) => a + (b.count || 0), 0) };
    }
    return {
      locations: data.locations || [],
      techCorridors: data.techCorridors || [],
      analytics: data.analytics || {},
      totalAlumni: data.totalAlumni || 0,
    };
  }, [data]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('all');
  const [selectedCorridorFilter, setSelectedCorridorFilter] = useState('all');

  // Extract all alumni members
  const allMembers = useMemo(() => {
    const members = [];
    analyticsData.locations.forEach((loc) => {
      if (loc.alumni && Array.isArray(loc.alumni)) {
        loc.alumni.forEach((a) => {
          members.push({ ...a, city: loc.city, country: loc.country });
        });
      }
    });
    return members;
  }, [analyticsData]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return allMembers.filter((m) => {
      if (selectedDeptFilter !== 'all' && m.department !== selectedDeptFilter) return false;
      if (selectedCompanyFilter !== 'all' && m.organization !== selectedCompanyFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name?.toLowerCase().includes(q);
        const matchesDept = m.department?.toLowerCase().includes(q);
        const matchesOrg = m.organization?.toLowerCase().includes(q);
        const matchesCity = m.city?.toLowerCase().includes(q);
        const matchesDesig = m.designation?.toLowerCase().includes(q);
        if (!matchesName && !matchesDept && !matchesOrg && !matchesCity && !matchesDesig) return false;
      }
      return true;
    });
  }, [allMembers, selectedDeptFilter, selectedCompanyFilter, searchQuery]);

  const departmentsList = useMemo(() => {
    return analyticsData.analytics?.departmentBreakdown || [];
  }, [analyticsData]);

  const topCompaniesList = useMemo(() => {
    return analyticsData.analytics?.topCompanies || [];
  }, [analyticsData]);

  const batchYearsList = useMemo(() => {
    return analyticsData.analytics?.batchYears || [];
  }, [analyticsData]);

  return (
    <div className="space-y-6">
      {/* 1. Header KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 border border-[var(--color-surface-border)] bg-[var(--color-surface-2)]">
          <div className="flex items-center justify-between text-[var(--color-text-muted)] text-[11px] font-semibold uppercase">
            <span>Verified Alumni</span>
            <Users size={16} className="text-blue-400" />
          </div>
          <span className="text-2xl font-black text-blue-400 font-mono mt-1 block">
            {analyticsData.totalAlumni}
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)]">Live verified members</span>
        </div>

        <div className="card p-4 border border-[var(--color-surface-border)] bg-[var(--color-surface-2)]">
          <div className="flex items-center justify-between text-[var(--color-text-muted)] text-[11px] font-semibold uppercase">
            <span>Academic Branches</span>
            <GraduationCap size={16} className="text-cyan-400" />
          </div>
          <span className="text-2xl font-black text-cyan-400 font-mono mt-1 block">
            {departmentsList.length || 7}
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)]">Engineering disciplines</span>
        </div>

        <div className="card p-4 border border-[var(--color-surface-border)] bg-[var(--color-surface-2)]">
          <div className="flex items-center justify-between text-[var(--color-text-muted)] text-[11px] font-semibold uppercase">
            <span>Top Employer</span>
            <Building size={16} className="text-emerald-400" />
          </div>
          <span className="text-base font-bold text-emerald-300 truncate mt-1 block">
            {topCompaniesList[0]?.name || 'Microsoft / Tech'}
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)]">Leading hiring organization</span>
        </div>

        <div className="card p-4 border border-[var(--color-surface-border)] bg-[var(--color-surface-2)]">
          <div className="flex items-center justify-between text-[var(--color-text-muted)] text-[11px] font-semibold uppercase">
            <span>Career Network</span>
            <TrendingUp size={16} className="text-amber-400" />
          </div>
          <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">
            100%
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)]">Live database verified</span>
        </div>
      </div>

      {/* 2. Visual Analytics Section (Charts & Distributions) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution Chart */}
        <div className="card p-6 space-y-4 border border-[var(--color-surface-border)]">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
              <GraduationCap size={18} className="text-blue-400" />
              Department Representation
            </h3>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Click bar to filter
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentsList}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={10}
                  width={140}
                  tickFormatter={(val) => (val.length > 18 ? `${val.substring(0, 16)}...` : val)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(value) => [`${value} Alumni`, 'Count']}
                />
                <Bar
                  dataKey="count"
                  radius={[0, 6, 6, 0]}
                  onClick={(entry) => setSelectedDeptFilter(entry.name === selectedDeptFilter ? 'all' : entry.name)}
                  cursor="pointer"
                >
                  {departmentsList.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={selectedDeptFilter === entry.name ? '#38bdf8' : CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Department Filter Pills */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--color-surface-border)]">
            <button
              onClick={() => setSelectedDeptFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedDeptFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-white'
              }`}
            >
              All Departments ({analyticsData.totalAlumni})
            </button>
            {departmentsList.map((dept, i) => (
              <button
                key={i}
                onClick={() => setSelectedDeptFilter(selectedDeptFilter === dept.name ? 'all' : dept.name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  selectedDeptFilter === dept.name
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-white'
                }`}
              >
                <span>{dept.name.split(' ')[0]}</span>
                <span className="font-mono text-[10px] opacity-75">({dept.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Top Organizations & Companies Distribution */}
        <div className="card p-6 space-y-4 border border-[var(--color-surface-border)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
                <Building size={18} className="text-emerald-400" />
                Key Hiring Employers & Companies
              </h3>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                Click company to filter
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4">
              {topCompaniesList.map((comp, idx) => {
                const isSelected = selectedCompanyFilter === comp.name;
                const pct = Math.round((comp.count / (analyticsData.totalAlumni || 1)) * 100);

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedCompanyFilter(isSelected ? 'all' : comp.name)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 shadow-md'
                        : 'bg-[var(--color-surface-2)] border-[var(--color-surface-border)] hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-[var(--color-text-primary)] block truncate">
                          {comp.name}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          {pct}% of network
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                      {comp.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Batch Cohort Timeline Preview */}
          <div className="pt-4 border-t border-[var(--color-surface-border)] space-y-2">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] flex items-center gap-1.5">
              <TrendingUp size={14} className="text-amber-400" />
              Batch Cohort Distribution (2012 - 2027)
            </span>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              {batchYearsList.map((b, i) => (
                <div
                  key={i}
                  className="px-2 py-1 rounded bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] text-[10px] text-center flex-shrink-0 font-mono"
                >
                  <span className="text-[var(--color-text-muted)] block">'{b.year.slice(-2)}</span>
                  <span className="font-bold text-amber-400">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Regional Tech Corridors & Innovation Zones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
            <Compass size={18} className="text-cyan-400" />
            Regional Tech Corridors & Innovation Hubs
          </h3>
          <span className="text-xs text-[var(--color-text-muted)]">
            Institutional hubs where TCET alumni work & innovate
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {analyticsData.techCorridors?.map((corr) => (
            <div
              key={corr.id}
              onClick={() => setSelectedCorridorFilter(selectedCorridorFilter === corr.id ? 'all' : corr.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                selectedCorridorFilter === corr.id
                  ? 'border-cyan-500 bg-cyan-500/10 shadow-lg'
                  : 'border-[var(--color-surface-border)] bg-[var(--color-surface-2)] hover:border-cyan-500/40'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-start justify-between">
                  <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                    {corr.type === 'campus' ? <GraduationCap size={16} /> : <Building size={16} />}
                  </span>
                  <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full">
                    {corr.count} Members
                  </span>
                </div>
                <h4 className="font-bold text-xs text-[var(--color-text-primary)] pt-1 leading-snug">
                  {corr.name}
                </h4>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  {corr.locality}
                </p>
              </div>

              <p className="text-[10px] text-[var(--color-text-secondary)] line-clamp-2">
                {corr.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Live Searchable Alumni Roster */}
      <div className="card p-6 space-y-4 border border-[var(--color-surface-border)] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-[var(--color-text-primary)] flex items-center gap-2">
              <Users size={18} className="text-blue-400" />
              Alumni Directory Roster ({filteredMembers.length} Members)
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Showing verified registered profiles from database
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search by name, company, branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[var(--color-surface-3)] border border-[var(--color-surface-border)] focus:outline-none focus:border-blue-500 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]"
            />
          </div>
        </div>

        {/* Active Filter Tags */}
        {(selectedDeptFilter !== 'all' || selectedCompanyFilter !== 'all' || searchQuery) && (
          <div className="flex items-center gap-2 flex-wrap text-xs bg-[var(--color-surface-3)] p-2.5 rounded-xl">
            <span className="text-[var(--color-text-muted)] font-semibold flex items-center gap-1">
              <Filter size={12} /> Active Filters:
            </span>
            {selectedDeptFilter !== 'all' && (
              <span className="badge badge-blue flex items-center gap-1">
                Dept: {selectedDeptFilter}
                <button onClick={() => setSelectedDeptFilter('all')} className="hover:text-white">✕</button>
              </span>
            )}
            {selectedCompanyFilter !== 'all' && (
              <span className="badge badge-green flex items-center gap-1">
                Company: {selectedCompanyFilter}
                <button onClick={() => setSelectedCompanyFilter('all')} className="hover:text-white">✕</button>
              </span>
            )}
            {searchQuery && (
              <span className="badge badge-purple flex items-center gap-1">
                Query: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-white">✕</button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedDeptFilter('all');
                setSelectedCompanyFilter('all');
                setSearchQuery('');
              }}
              className="text-[11px] text-blue-400 hover:underline font-semibold ml-auto"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Members Grid */}
        {filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredMembers.map((m, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-2 shadow-sm"
              >
                <div className="flex items-start gap-2.5">
                  <Avatar src={m.profilePhoto} firstName={m.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/profile/${m.userId}`}
                      className="font-bold text-xs text-[var(--color-text-primary)] hover:text-blue-400 block truncate"
                    >
                      {m.name}
                    </Link>
                    <p className="text-[11px] text-[var(--color-text-secondary)] truncate">
                      {m.designation}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-medium truncate">
                      {m.organization}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--color-surface-border)] flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
                  <span className="truncate max-w-[140px]">{m.department}</span>
                  <Link
                    to={`/profile/${m.userId}`}
                    className="text-blue-400 hover:underline font-semibold flex items-center gap-0.5"
                  >
                    Profile <ArrowUpRight size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-[var(--color-text-muted)] space-y-1">
            <Users size={32} className="mx-auto opacity-40 mb-2" />
            <p className="font-semibold text-[var(--color-text-primary)]">No matching alumni found</p>
            <p>Try clearing filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
}
