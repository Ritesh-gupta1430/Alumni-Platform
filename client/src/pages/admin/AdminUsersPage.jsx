import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Filter,
  Building,
  UserCheck
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { RoleBadge, StatusBadge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { DEPARTMENTS, formatDate, timeAgo } from '../../lib/utils';

export default function AdminUsersPage() {
  const toast = useToast();

  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Suspend Modal
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({
        q: searchQuery || undefined,
        role: filterRole || undefined,
        status: filterStatus || undefined,
        department: filterDept || undefined,
        page,
        limit: 20,
      });
      setUsersList(res.data.data.users || []);
      setTotalPages(res.data.data.pages || 1);
    } catch (err) {
      toast.error('Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterRole, filterStatus, filterDept, page, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user, newStatus, reason = '') => {
    try {
      await adminAPI.updateUserStatus(user._id, { accountStatus: newStatus, reason });
      toast.success(`User account ${newStatus}.`);
      setShowSuspendModal(false);
      setSuspendReason('');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update account status.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Back button */}
      <Link
        to="/admin"
        className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <ChevronLeft size={16} /> Back to Admin Dashboard
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2.5">
          <Users className="text-blue-400" size={26} />
          User Management & Moderation
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Audit registered member accounts, inspect login activity, and moderate access.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            icon={Search}
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <Select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="ALUMNI">Alumni</option>
            <option value="FACULTY">Faculty</option>
            <option value="RECRUITER">Recruiter</option>
            <option value="ADMIN">Admin</option>
          </Select>

          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deactivated">Deactivated</option>
            <option value="pending_verification">Pending Verification</option>
          </Select>

          <Select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card divide-y divide-[var(--color-surface-border)] overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--color-text-muted)] animate-pulse">
            Loading user accounts...
          </div>
        ) : usersList.length > 0 ? (
          usersList.map((u) => (
            <div
              key={u._id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <div className="flex items-start gap-3">
                <Avatar
                  src={u.profilePhoto}
                  firstName={u.firstName}
                  lastName={u.lastName}
                  size="md"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/profile/${u._id}`}
                      className="font-bold text-sm text-[var(--color-text-primary)] hover:text-blue-400"
                    >
                      {u.firstName} {u.lastName}
                    </Link>
                    <RoleBadge role={u.role} />
                    <StatusBadge status={u.accountStatus} />
                    <VerificationBadge badge={u.verificationBadge} />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {u.email} • {u.department || 'Department N/A'}
                    {u.graduationYear ? ` • Class of ${u.graduationYear}` : ''}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Link to={`/profile/${u._id}`}>
                  <Button variant="ghost" size="sm" className="text-xs">
                    View Profile
                  </Button>
                </Link>

                {u.accountStatus === 'suspended' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(u, 'active')}
                    className="text-xs text-emerald-400 border-emerald-500/30"
                  >
                    Reactivate Account
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedUser(u);
                      setShowSuspendModal(true);
                    }}
                    className="text-xs text-rose-400 hover:bg-rose-500/10"
                  >
                    Suspend Access
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-16 text-center text-sm text-[var(--color-text-muted)]">
            No users found matching your search filters.
          </div>
        )}
      </div>

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

      {/* ===== SUSPEND ACCOUNT MODAL ===== */}
      <Modal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        title={`Suspend User Account: ${selectedUser?.firstName} ${selectedUser?.lastName}`}
        size="md"
      >
        <div className="space-y-4">
          <Textarea
            label="Reason for Suspension"
            required
            rows={3}
            placeholder="e.g. Violation of community guidelines / Inappropriate messaging..."
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowSuspendModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => handleToggleStatus(selectedUser, 'suspended', suspendReason)}
            >
              Confirm Suspension
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
