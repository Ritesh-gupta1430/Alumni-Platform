import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  UserCheck,
  Clock,
  MapPin,
  Building,
  GraduationCap,
  MessageSquare,
  Sparkles,
  Check,
  X,
  Globe2,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { usersAPI, connectionsAPI, messagesAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, RoleBadge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { DEPARTMENTS, YEARS } from '../../lib/utils';

export default function NetworkPage() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'connections' | 'pending' | 'batchmates' | 'map'

  // Directory State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Connections State
  const [connections, setConnections] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);

  // Pending Requests State
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  // Batchmates State
  const [batchmates, setBatchmates] = useState([]);
  const [batchmatesLoading, setBatchmatesLoading] = useState(false);

  // Alumni Map State
  const [alumniMap, setAlumniMap] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);

  // Connection Modal
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [connectMessage, setConnectMessage] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Fetch Directory Users
  const fetchDirectory = useCallback(async () => {
    setDirectoryLoading(true);
    try {
      const res = await usersAPI.search({
        q: searchQuery || undefined,
        role: filterRole || undefined,
        department: filterDepartment || undefined,
        graduationYear: filterYear || undefined,
        page,
        limit: 12,
      });
      setUsersList(res.data.data.users);
      setTotalPages(res.data.data.pages);
    } catch (err) {
      toast.error('Failed to load user directory.');
    } finally {
      setDirectoryLoading(false);
    }
  }, [searchQuery, filterRole, filterDepartment, filterYear, page, toast]);

  // Fetch Connections
  const fetchConnections = useCallback(async () => {
    setConnectionsLoading(true);
    try {
      const res = await connectionsAPI.getMine({ status: 'accepted', limit: 50 });
      setConnections(res.data.data.connections);
    } catch (err) {
      toast.error('Failed to load your connections.');
    } finally {
      setConnectionsLoading(false);
    }
  }, [toast]);

  // Fetch Pending Requests
  const fetchPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await connectionsAPI.getPending();
      setPendingRequests(res.data.data);
    } catch (err) {
      toast.error('Failed to load pending connection requests.');
    } finally {
      setPendingLoading(false);
    }
  }, [toast]);

  // Fetch Batchmates
  const fetchBatchmates = useCallback(async () => {
    setBatchmatesLoading(true);
    try {
      const res = await usersAPI.getBatchmates({ limit: 24 });
      setBatchmates(res.data.data.users);
    } catch (err) {
      toast.error('Failed to load batchmates.');
    } finally {
      setBatchmatesLoading(false);
    }
  }, [toast]);

  // Fetch Alumni Map
  const fetchAlumniMap = useCallback(async () => {
    setMapLoading(true);
    try {
      const res = await usersAPI.getAlumniMap();
      setAlumniMap(res.data.data);
    } catch (err) {
      toast.error('Failed to load alumni distribution data.');
    } finally {
      setMapLoading(false);
    }
  }, [toast]);

  // Tab change trigger
  useEffect(() => {
    if (activeTab === 'directory') fetchDirectory();
    else if (activeTab === 'connections') fetchConnections();
    else if (activeTab === 'pending') fetchPending();
    else if (activeTab === 'batchmates') fetchBatchmates();
    else if (activeTab === 'map') fetchAlumniMap();
  }, [activeTab, fetchDirectory, fetchConnections, fetchPending, fetchBatchmates, fetchAlumniMap]);

  // Send Connection Request
  const handleOpenConnect = (target) => {
    setSelectedUser(target);
    setConnectMessage('');
    setShowConnectModal(true);
  };

  const handleSendConnection = async () => {
    if (!selectedUser) return;
    setConnecting(true);
    try {
      await connectionsAPI.sendRequest(selectedUser._id, { message: connectMessage });
      toast.success(`Connection request sent to ${selectedUser.firstName}!`);
      setShowConnectModal(false);
      
      // Update local state optimistically
      setUsersList((prev) =>
        prev.map((u) =>
          u._id === selectedUser._id
            ? { ...u, connectionStatus: { status: 'pending', isRequester: true } }
            : u
        )
      );
      setBatchmates((prev) =>
        prev.map((u) =>
          u._id === selectedUser._id
            ? { ...u, connectionStatus: { status: 'pending', isRequester: true } }
            : u
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request.');
    } finally {
      setConnecting(false);
    }
  };

  // Accept Connection
  const handleAccept = async (id) => {
    try {
      await connectionsAPI.accept(id);
      toast.success('Connection request accepted!');
      fetchPending();
      fetchConnections();
    } catch (err) {
      toast.error('Failed to accept request.');
    }
  };

  // Decline Connection
  const handleDecline = async (id) => {
    try {
      await connectionsAPI.decline(id);
      toast.info('Connection request declined.');
      fetchPending();
    } catch (err) {
      toast.error('Failed to decline request.');
    }
  };

  // Remove Connection
  const handleRemoveConnection = async (id) => {
    if (!window.confirm('Are you sure you want to remove this connection?')) return;
    try {
      await connectionsAPI.remove(id);
      toast.success('Connection removed.');
      fetchConnections();
    } catch (err) {
      toast.error('Failed to remove connection.');
    }
  };

  // Message User
  const handleMessageUser = async (targetId) => {
    try {
      const res = await messagesAPI.startConversation({ recipientId: targetId });
      navigate(`/messages?convo=${res.data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not open messages.');
    }
  };

  const tabs = [
    { id: 'directory', label: 'Explore Directory', icon: Users },
    { id: 'connections', label: `My Connections (${connections.length})`, icon: UserCheck },
    { id: 'pending', label: `Pending Requests (${pendingRequests.length})`, icon: Clock, badge: pendingRequests.length },
    { id: 'batchmates', label: 'Batchmates', icon: GraduationCap },
    { id: 'map', label: 'Alumni World Map', icon: Globe2 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">AlumNetra Network</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Connect with students, alumni, faculty, and industry mentors across the globe.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-surface-border)] overflow-x-auto no-scrollbar gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors relative ${
                isActive
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {tab.badge > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-blue-500 text-white font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===== TAB 1: DIRECTORY & DISCOVER ===== */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Search and Filters Bar */}
          <div className="card p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-2">
                <Input
                  icon={Search}
                  placeholder="Search by name, email, or skill..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="STUDENT">Students</option>
                <option value="ALUMNI">Alumni</option>
                <option value="FACULTY">Faculty</option>
                <option value="RECRUITER">Recruiter</option>
              </Select>

              <Select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </Select>

              <Select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value="">All Years</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    Class of {y}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Directory Users Grid */}
          {directoryLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="card p-6 h-48 animate-pulse bg-[var(--color-surface-2)]" />
              ))}
            </div>
          ) : usersList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {usersList.map((target) => (
                <div
                  key={target._id}
                  className="card p-5 flex flex-col justify-between hover:border-blue-500/40 transition-all shadow-sm group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={target.profilePhoto}
                        firstName={target.firstName}
                        lastName={target.lastName}
                        size="lg"
                      />
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            to={`/profile/${target._id}`}
                            className="font-bold text-sm text-[var(--color-text-primary)] hover:text-blue-400 truncate"
                          >
                            {target.firstName} {target.lastName}
                          </Link>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <RoleBadge role={target.role} />
                          <VerificationBadge badge={target.verificationBadge} />
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">
                          {target.department} {target.graduationYear ? `• '` + String(target.graduationYear).slice(2) : ''}
                        </p>
                      </div>
                    </div>

                    {/* Headline or Org */}
                    {target.profile?.headline ? (
                      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                        {target.profile.headline}
                      </p>
                    ) : target.profile?.currentOrganization ? (
                      <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
                        <Building size={12} className="text-blue-400" />
                        {target.profile.currentOrganization}
                      </p>
                    ) : null}

                    {target.profile?.currentCity && (
                      <p className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                        <MapPin size={11} className="text-rose-400" />
                        {target.profile.currentCity}
                      </p>
                    )}

                    {target.profile?.isMentor && (
                      <span className="inline-block badge badge-gold text-[10px]">
                        ★ Mentor
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 mt-2 border-t border-[var(--color-surface-border)]">
                    <Link to={`/profile/${target._id}`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full text-xs">
                        View Profile
                      </Button>
                    </Link>

                    {currentUser?._id === target._id ? (
                      <span className="text-xs text-[var(--color-text-muted)] px-3 py-1 font-mono">
                        (You)
                      </span>
                    ) : target.connectionStatus?.status === 'accepted' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMessageUser(target._id)}
                        className="flex items-center gap-1.5 text-xs text-emerald-400 border-emerald-500/30"
                      >
                        <MessageSquare size={13} /> Message
                      </Button>
                    ) : target.connectionStatus?.status === 'pending' ? (
                      target.connectionStatus.isRequester ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          className="flex items-center gap-1.5 text-xs opacity-75"
                        >
                          <Clock size={13} /> Pending
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAccept(target.connectionStatus.connectionId)}
                          className="flex items-center gap-1.5 text-xs"
                        >
                          <Check size={13} /> Accept
                        </Button>
                      )
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenConnect(target)}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <UserPlus size={14} /> Connect
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center text-sm text-[var(--color-text-muted)]">
              <Users size={36} className="mx-auto mb-2 opacity-40" />
              <p>No members found matching your search criteria.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-xs font-mono text-[var(--color-text-muted)]">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 2: MY CONNECTIONS ===== */}
      {activeTab === 'connections' && (
        <div className="space-y-4">
          {connectionsLoading ? (
            <div className="card p-12 text-center text-sm text-[var(--color-text-muted)] animate-pulse">
              Loading connections...
            </div>
          ) : connections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((conn) => {
                const partner = conn.requester?._id === currentUser?._id ? conn.recipient : conn.requester;
                if (!partner) return null;

                return (
                  <div key={conn._id} className="card p-5 flex flex-col justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={partner.profilePhoto}
                        firstName={partner.firstName}
                        lastName={partner.lastName}
                        size="md"
                      />
                      <div className="overflow-hidden flex-1">
                        <Link
                          to={`/profile/${partner._id}`}
                          className="font-bold text-sm text-[var(--color-text-primary)] hover:text-blue-400 block truncate"
                        >
                          {partner.firstName} {partner.lastName}
                        </Link>
                        <div className="flex items-center gap-1 mt-0.5">
                          <RoleBadge role={partner.role} />
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">
                          {partner.department}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 mt-3 border-t border-[var(--color-surface-border)]">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleMessageUser(partner._id)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs"
                      >
                        <MessageSquare size={14} /> Message
                      </Button>
                      <button
                        onClick={() => handleRemoveConnection(conn._id)}
                        className="p-2 hover:bg-rose-500/10 text-[var(--color-text-muted)] hover:text-rose-400 rounded-lg transition-colors"
                        title="Remove Connection"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card p-12 text-center text-sm text-[var(--color-text-muted)]">
              <UserCheck size={36} className="mx-auto mb-2 opacity-40" />
              <p className="font-semibold text-[var(--color-text-primary)]">No connections yet</p>
              <p className="mt-1">Connect with alumni, students, and peers from the Explore Directory tab!</p>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 3: PENDING REQUESTS ===== */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingLoading ? (
            <div className="card p-12 text-center text-sm text-[var(--color-text-muted)] animate-pulse">
              Loading requests...
            </div>
          ) : pendingRequests.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pendingRequests.map((req) => (
                <div key={req._id} className="card p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={req.requester?.profilePhoto}
                      firstName={req.requester?.firstName}
                      lastName={req.requester?.lastName}
                      size="lg"
                    />
                    <div className="flex-1 overflow-hidden">
                      <Link
                        to={`/profile/${req.requester?._id}`}
                        className="font-bold text-sm text-[var(--color-text-primary)] hover:underline"
                      >
                        {req.requester?.firstName} {req.requester?.lastName}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <RoleBadge role={req.requester?.role} />
                        <VerificationBadge badge={req.requester?.verificationBadge} />
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {req.requester?.department} • Class of {req.requester?.graduationYear}
                      </p>
                    </div>
                  </div>

                  {req.message && (
                    <p className="text-xs italic p-3 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]">
                      "{req.message}"
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleAccept(req._id)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs"
                    >
                      <Check size={14} /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDecline(req._id)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs text-rose-400 hover:bg-rose-500/10"
                    >
                      <X size={14} /> Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center text-sm text-[var(--color-text-muted)]">
              <Clock size={36} className="mx-auto mb-2 opacity-40" />
              <p>You have no pending connection requests at the moment.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 4: BATCHMATES ===== */}
      {activeTab === 'batchmates' && (
        <div className="space-y-4">
          <div className="card p-4 bg-purple-500/10 border border-purple-500/20">
            <h3 className="font-bold text-sm text-purple-300">Your Batch: {currentUser?.department}</h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Class of {currentUser?.graduationYear || 'Current'}
            </p>
          </div>

          {batchmatesLoading ? (
            <div className="card p-12 text-center text-sm text-[var(--color-text-muted)] animate-pulse">
              Loading batchmates...
            </div>
          ) : batchmates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {batchmates.map((target) => (
                <div key={target._id} className="card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={target.profilePhoto}
                      firstName={target.firstName}
                      lastName={target.lastName}
                      size="md"
                    />
                    <div>
                      <Link
                        to={`/profile/${target._id}`}
                        className="font-bold text-sm text-[var(--color-text-primary)] hover:text-blue-400"
                      >
                        {target.firstName} {target.lastName}
                      </Link>
                      <p className="text-xs text-[var(--color-text-muted)]">{target.role}</p>
                    </div>
                  </div>
                  {currentUser?._id === target._id ? (
                    <span className="text-xs text-[var(--color-text-muted)] font-mono">
                      (You)
                    </span>
                  ) : target.connectionStatus?.status === 'accepted' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMessageUser(target._id)}
                      className="text-xs text-emerald-400 border-emerald-500/30"
                    >
                      <MessageSquare size={13} className="mr-1" /> Message
                    </Button>
                  ) : target.connectionStatus?.status === 'pending' ? (
                    target.connectionStatus.isRequester ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        className="text-xs opacity-75"
                      >
                        <Clock size={13} className="mr-1" /> Pending
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAccept(target.connectionStatus.connectionId)}
                        className="text-xs"
                      >
                        <Check size={13} className="mr-1" /> Accept
                      </Button>
                    )
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenConnect(target)}
                      className="text-xs"
                    >
                      <UserPlus size={13} className="mr-1" /> Connect
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center text-sm text-[var(--color-text-muted)]">
              <GraduationCap size={36} className="mx-auto mb-2 opacity-40" />
              <p>No other batchmates found for your department and graduation year yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 5: ALUMNI GLOBAL DISTRIBUTION ===== */}
      {activeTab === 'map' && (
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Globe2 size={20} className="text-blue-400" />
              Alumni Geo-Distribution
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Cities and regions around the world where TCET alumni are currently based.
            </p>

            {mapLoading ? (
              <div className="p-12 text-center text-sm text-[var(--color-text-muted)] animate-pulse">
                Loading geographical data...
              </div>
            ) : alumniMap.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {alumniMap.map((loc, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[var(--color-text-primary)]">{loc.city}</h4>
                        <p className="text-xs text-[var(--color-text-muted)]">{loc.country}</p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold text-blue-400">
                      {loc.count} {loc.count === 1 ? 'Alum' : 'Alumni'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
                No location data registered for alumni yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== CONNECT NOTE MODAL ===== */}
      <Modal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        title={selectedUser ? `Connect with ${selectedUser.firstName} ${selectedUser.lastName}` : 'Connect'}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Send an invitation to expand your network. You can include a custom introductory message.
          </p>
          <Textarea
            rows={4}
            placeholder="Hi, I'd like to connect with you on AlumNetra to discuss career opportunities..."
            value={connectMessage}
            onChange={(e) => setConnectMessage(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowConnectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={connecting}
              onClick={handleSendConnection}
            >
              Send Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
