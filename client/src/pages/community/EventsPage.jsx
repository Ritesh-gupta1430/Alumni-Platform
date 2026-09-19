import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Plus,
  Video,
  CheckCircle2,
  Sparkles,
  Star,
  ExternalLink,
  Search,
  Share2,
  Copy,
  Info,
  CalendarPlus,
  UserCheck,
  Tag,
  ArrowRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { communityAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../lib/utils';

export default function EventsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMode, setSelectedMode] = useState('all');
  const [registeringId, setRegisteringId] = useState(null);

  // Detail Modal State
  const [selectedEventDetail, setSelectedEventDetail] = useState(null);

  // Create Event Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    category: 'webinar',
    mode: 'online',
    venue: '',
    meetingLink: '',
    startDate: '',
    endDate: '',
    capacity: 100,
    speakerName: '',
    speakerDesignation: '',
    speakerBio: '',
  });

  // Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackEvent, setFeedbackEvent] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await communityAPI.listEvents({ limit: 50 });
      setEvents(res.data.data?.events || []);
    } catch (err) {
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle Event RSVP Registration
  const handleRegister = async (eventId, e) => {
    if (e) e.stopPropagation();
    setRegisteringId(eventId);
    try {
      await communityAPI.registerEvent(eventId);
      toast.success('Successfully registered for the event!');
      
      // Update local events state immediately
      setEvents((prev) =>
        prev.map((ev) =>
          ev._id === eventId
            ? {
                ...ev,
                isRegistered: true,
                registrationCount: (ev.registrationCount || 0) + 1,
              }
            : ev
        )
      );

      // If detail modal is open for this event, update it too
      if (selectedEventDetail && selectedEventDetail._id === eventId) {
        setSelectedEventDetail((prev) => ({
          ...prev,
          isRegistered: true,
          registrationCount: (prev.registrationCount || 0) + 1,
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register for event.');
    } finally {
      setRegisteringId(null);
    }
  };

  // Handle Create Event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        title: eventForm.title,
        description: eventForm.description,
        category: eventForm.category,
        mode: eventForm.mode,
        venue: eventForm.mode === 'offline' || eventForm.mode === 'hybrid' ? eventForm.venue : undefined,
        meetingLink: eventForm.mode === 'online' || eventForm.mode === 'hybrid' ? eventForm.meetingLink : undefined,
        startDate: eventForm.startDate,
        endDate: eventForm.endDate || undefined,
        capacity: Number(eventForm.capacity) || 100,
      };

      if (eventForm.speakerName) {
        payload.speakers = [
          {
            name: eventForm.speakerName,
            designation: eventForm.speakerDesignation,
            bio: eventForm.speakerBio,
          },
        ];
      }

      await communityAPI.createEvent(payload);
      toast.success('Event published successfully!');
      setShowCreateModal(false);
      setEventForm({
        title: '',
        description: '',
        category: 'webinar',
        mode: 'online',
        venue: '',
        meetingLink: '',
        startDate: '',
        endDate: '',
        capacity: 100,
        speakerName: '',
        speakerDesignation: '',
        speakerBio: '',
      });
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event.');
    } finally {
      setCreating(false);
    }
  };

  // Handle Submit Feedback
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackEvent) return;
    try {
      await communityAPI.submitFeedback(feedbackEvent._id, feedbackForm);
      toast.success('Thank you for your feedback!');
      setShowFeedbackModal(false);
    } catch (err) {
      toast.error('Failed to submit feedback.');
    }
  };

  // Helper to generate Google Calendar Link
  const getGoogleCalendarUrl = (evt) => {
    if (!evt || !evt.startDate) return '#';
    const formatGDate = (d) => new Date(d).toISOString().replace(/-|:|\.\d+/g, '');
    const startStr = formatGDate(evt.startDate);
    const endStr = evt.endDate ? formatGDate(evt.endDate) : formatGDate(new Date(new Date(evt.startDate).getTime() + 2 * 3600000));
    const title = encodeURIComponent(evt.title || 'Alumni Event');
    const details = encodeURIComponent(`${evt.description || ''}\n\nJoin: ${evt.meetingLink || evt.venue || ''}`);
    const location = encodeURIComponent(evt.mode === 'online' ? (evt.meetingLink || 'Online Webinar') : (evt.venue || 'TCET Campus'));
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
  };

  // Filtered Events
  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      !searchQuery ||
      evt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      evt.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesMode =
      selectedMode === 'all' ||
      (selectedMode === 'online' && (evt.mode === 'online' || evt.locationType === 'online')) ||
      (selectedMode === 'in_person' && (evt.mode === 'offline' || evt.locationType === 'in_person' || evt.mode === 'hybrid'));

    return matchesSearch && matchesCategory && matchesMode;
  });

  const getCategoryBadgeClass = (category) => {
    switch (category?.toLowerCase()) {
      case 'webinar':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'workshop':
      case 'seminar':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'hackathon':
      case 'competition':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'reunion':
      case 'alumni_meet':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'career_talk':
      case 'guest_lecture':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[var(--color-surface-2)] via-[var(--color-surface)] to-[var(--color-surface-2)] border border-[var(--color-surface-border)] shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Calendar size={22} />
            </span>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Alumni Meets, Webinars & Hackathons
            </h1>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
            Attend curated college sessions, tech webinars, reunions, and networking dinners. Click on any event to view complete details, agenda, and speakers.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          variant="primary"
          className="flex items-center gap-2 whitespace-nowrap self-start sm:self-auto shadow-md shadow-cyan-500/20"
        >
          <Plus size={16} /> Host an Event
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-surface-border)]">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search events, topics, or venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] rounded-lg pl-9 pr-3 py-2 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-cyan-400/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] text-[var(--color-text-secondary)] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400/50 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="webinar">Webinars</option>
            <option value="workshop">Workshops</option>
            <option value="hackathon">Hackathons</option>
            <option value="reunion">Reunions / Meets</option>
            <option value="career_talk">Career Talks</option>
            <option value="guest_lecture">Guest Lectures</option>
          </select>

          {/* Mode Filter */}
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] text-[var(--color-text-secondary)] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400/50 cursor-pointer"
          >
            <option value="all">All Modes</option>
            <option value="online">Online (Webinar / Zoom)</option>
            <option value="in_person">In-Person (Campus / Venue)</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="card p-6 h-72 animate-pulse bg-[var(--color-surface-2)] rounded-xl" />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((evt) => {
            const isFull = evt.capacity && (evt.registrationCount || 0) >= evt.capacity;
            const isPast = new Date(evt.startDate) < new Date();
            const isOnline = evt.mode === 'online' || evt.locationType === 'online';
            const capacityPercent = Math.min(100, Math.round(((evt.registrationCount || 0) / (evt.capacity || 100)) * 100));

            return (
              <motion.div
                key={evt._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedEventDetail(evt)}
                className="card p-5 flex flex-col justify-between hover:border-cyan-500/50 transition-all duration-200 shadow-sm hover:shadow-md group relative cursor-pointer border border-[var(--color-surface-border)] rounded-xl bg-[var(--color-surface)]"
              >
                <div className="space-y-3">
                  {/* Top Header: Badge + Mode + Seats */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${getCategoryBadgeClass(evt.category)}`}>
                      {evt.category ? evt.category.replace('_', ' ') : 'Event'}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1 font-mono">
                      <Users size={12} className="text-cyan-400" /> {evt.registrationCount || 0} / {evt.capacity || 100} seats
                    </span>
                  </div>

                  {/* Title & Date */}
                  <div>
                    <h2 className="text-base font-bold text-[var(--color-text-primary)] group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
                      {evt.title}
                    </h2>
                    <p className="text-xs text-cyan-300 font-medium flex items-center gap-1.5 mt-1.5">
                      <Clock size={13} className="shrink-0" />
                      {formatDate(evt.startDate, 'EEEE, MMM d, yyyy • h:mm a')}
                    </p>
                  </div>

                  {/* Location / Mode Badge */}
                  <div className="flex items-center gap-1.5 text-xs">
                    {isOnline ? (
                      <span className="flex items-center gap-1 text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                        <Video size={12} /> Online Webinar
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                        <MapPin size={12} /> {evt.venue || evt.location || 'TCET Campus'}
                      </span>
                    )}

                    {evt.isRegistered && (
                      <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium text-[11px]">
                        <CheckCircle2 size={12} /> Registered
                      </span>
                    )}
                  </div>

                  {/* Event Short Description */}
                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>

                  {/* Organizer Preview */}
                  {evt.organizer && (
                    <div className="flex items-center gap-2 pt-1">
                      <Avatar
                        src={evt.organizer.profilePhoto}
                        name={`${evt.organizer.firstName || ''} ${evt.organizer.lastName || ''}`}
                        size="xs"
                      />
                      <span className="text-[11px] text-[var(--color-text-muted)] truncate">
                        Hosted by {evt.organizer.firstName} {evt.organizer.lastName}
                      </span>
                    </div>
                  )}

                  {/* Capacity Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="w-full bg-[var(--color-surface-2)] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          capacityPercent >= 90
                            ? 'bg-rose-500'
                            : capacityPercent >= 60
                            ? 'bg-amber-500'
                            : 'bg-cyan-500'
                        }`}
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 mt-4 border-t border-[var(--color-surface-border)] flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEventDetail(evt);
                    }}
                    className="flex-1 text-xs flex items-center justify-center gap-1 border-[var(--color-surface-border)] hover:border-cyan-400/40 text-[var(--color-text-secondary)]"
                  >
                    View Details <ArrowRight size={13} />
                  </Button>

                  {isPast ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFeedbackEvent(evt);
                        setShowFeedbackModal(true);
                      }}
                      className="text-xs text-amber-300 flex items-center justify-center gap-1"
                    >
                      <Star size={13} /> Feedback
                    </Button>
                  ) : evt.isRegistered ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEventDetail(evt);
                      }}
                      className="text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center gap-1 font-medium"
                    >
                      <CheckCircle2 size={13} /> RSVP'd
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={isFull}
                      loading={registeringId === evt._id}
                      onClick={(e) => handleRegister(evt._id, e)}
                      className="text-xs flex items-center justify-center gap-1 shadow-sm"
                    >
                      {isFull ? 'Full' : 'RSVP'}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="card p-16 text-center text-sm text-[var(--color-text-muted)] space-y-3 border border-[var(--color-surface-border)] rounded-xl">
          <Calendar size={44} className="mx-auto opacity-30 text-cyan-400 mb-1" />
          <p className="font-semibold text-base text-[var(--color-text-primary)]">No events match your criteria</p>
          <p className="text-xs max-w-sm mx-auto">
            Try adjusting your search query or filters to discover other upcoming webinars, hackathons, and meets.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedMode('all');
            }}
            className="text-xs"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* ===== DETAILED EVENT VIEW MODAL ===== */}
      <Modal
        isOpen={!!selectedEventDetail}
        onClose={() => setSelectedEventDetail(null)}
        title="Event Details & Agenda"
        size="lg"
      >
        {selectedEventDetail && (
          <div className="space-y-6">
            {/* Header Hero */}
            <div className="space-y-2.5 pb-4 border-b border-[var(--color-surface-border)]">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${getCategoryBadgeClass(selectedEventDetail.category)}`}>
                  {selectedEventDetail.category ? selectedEventDetail.category.replace('_', ' ') : 'Event'}
                </span>
                
                {selectedEventDetail.mode === 'online' || selectedEventDetail.locationType === 'online' ? (
                  <span className="flex items-center gap-1 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-medium">
                    <Video size={13} /> Online Webinar
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full font-medium">
                    <MapPin size={13} /> In-Person Event
                  </span>
                )}

                {selectedEventDetail.isRegistered && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                    <CheckCircle2 size={13} /> You are Registered
                  </span>
                )}
              </div>

              <h2 className="text-xl font-bold text-[var(--color-text-primary)] leading-tight">
                {selectedEventDetail.title}
              </h2>
            </div>

            {/* Key Event Metadata Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Date & Time */}
              <div className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                  <Clock size={18} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Date & Time</p>
                  <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {formatDate(selectedEventDetail.startDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-xs text-cyan-300 font-medium">
                    {formatDate(selectedEventDetail.startDate, 'h:mm a')}
                    {selectedEventDetail.endDate && ` – ${formatDate(selectedEventDetail.endDate, 'h:mm a')}`}
                  </p>
                </div>
              </div>

              {/* Venue / Meeting Location */}
              <div className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                  {selectedEventDetail.mode === 'online' || selectedEventDetail.locationType === 'online' ? (
                    <Video size={18} />
                  ) : (
                    <MapPin size={18} />
                  )}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                    {selectedEventDetail.mode === 'online' || selectedEventDetail.locationType === 'online' ? 'Meeting Platform' : 'Campus Venue'}
                  </p>
                  <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                    {selectedEventDetail.mode === 'online' || selectedEventDetail.locationType === 'online'
                      ? 'Online (Google Meet / Zoom)'
                      : (selectedEventDetail.venue || selectedEventDetail.location || 'TCET Campus')}
                  </p>
                  {selectedEventDetail.meetingLink && (
                    <a
                      href={selectedEventDetail.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-1 truncate"
                    >
                      Join Link <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Attendance & Registration Capacity Status */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/5 to-indigo-500/5 border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                  <Users size={14} className="text-cyan-400" /> Registration & Seats Status
                </span>
                <span className="font-mono text-cyan-300 font-semibold">
                  {selectedEventDetail.registrationCount || 0} / {selectedEventDetail.capacity || 100} spots filled
                </span>
              </div>
              <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(((selectedEventDetail.registrationCount || 0) / (selectedEventDetail.capacity || 100)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Full Event Overview & Agenda */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                <Info size={14} className="text-cyan-400" /> Overview & Agenda
              </h3>
              <div className="p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">
                {selectedEventDetail.description}
              </div>
            </div>

            {/* Speaker Information */}
            {selectedEventDetail.speakers && selectedEventDetail.speakers.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" /> Featured Speaker(s)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedEventDetail.speakers.map((spk, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] flex items-start gap-3"
                    >
                      <Avatar src={spk.photo} name={spk.name} size="md" />
                      <div className="space-y-0.5 overflow-hidden">
                        <p className="text-xs font-bold text-[var(--color-text-primary)]">{spk.name}</p>
                        {spk.designation && (
                          <p className="text-[11px] text-cyan-300 font-medium truncate">{spk.designation}</p>
                        )}
                        {spk.bio && (
                          <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-2 leading-tight pt-0.5">
                            {spk.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Host / Organizer details */}
            {selectedEventDetail.organizer && (
              <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={selectedEventDetail.organizer.profilePhoto}
                    name={`${selectedEventDetail.organizer.firstName || ''} ${selectedEventDetail.organizer.lastName || ''}`}
                    size="sm"
                  />
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {selectedEventDetail.organizer.firstName} {selectedEventDetail.organizer.lastName}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      Event Host • {selectedEventDetail.organizer.department || selectedEventDetail.organizer.role}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                  {selectedEventDetail.organizer.role}
                </Badge>
              </div>
            )}

            {/* Action Bar Footer */}
            <div className="pt-4 border-t border-[var(--color-surface-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Google Calendar Link */}
              <a
                href={getGoogleCalendarUrl(selectedEventDetail)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--color-surface-border)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-cyan-400 transition-colors"
              >
                <CalendarPlus size={14} /> Add to Google Calendar
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEventDetail(null)}
                  className="w-full sm:w-auto text-xs"
                >
                  Close
                </Button>

                {selectedEventDetail.isRegistered ? (
                  selectedEventDetail.meetingLink ? (
                    <a
                      href={selectedEventDetail.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-colors"
                    >
                      <ExternalLink size={14} /> Join Meeting Room
                    </a>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled
                      className="w-full sm:w-auto text-xs bg-emerald-600 border-emerald-600 text-white cursor-default"
                    >
                      <CheckCircle2 size={14} className="mr-1" /> Registered
                    </Button>
                  )
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={registeringId === selectedEventDetail._id}
                    disabled={selectedEventDetail.capacity && (selectedEventDetail.registrationCount || 0) >= selectedEventDetail.capacity}
                    onClick={() => handleRegister(selectedEventDetail._id)}
                    className="w-full sm:w-auto text-xs font-semibold px-5"
                  >
                    Confirm RSVP & Register
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== HOST EVENT MODAL ===== */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Host a College Event / Webinar"
        size="lg"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <Input
            label="Event Title"
            required
            placeholder="e.g. Alumni Career Talk: Breaking into FAANG"
            value={eventForm.title}
            onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Event Category"
              value={eventForm.category}
              onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
            >
              <option value="webinar">Online Webinar</option>
              <option value="reunion">Alumni Reunion / Meet</option>
              <option value="hackathon">Hackathon / Competition</option>
              <option value="workshop">Technical Workshop</option>
              <option value="career_talk">Career Talk & Mentorship</option>
              <option value="guest_lecture">Guest Lecture</option>
            </Select>

            <Select
              label="Format / Mode"
              value={eventForm.mode}
              onChange={(e) => setEventForm({ ...eventForm, mode: e.target.value })}
            >
              <option value="online">Online (Google Meet / Zoom)</option>
              <option value="offline">In-Person (TCET Campus / Venue)</option>
              <option value="hybrid">Hybrid (Both Online & In-Person)</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date & Time"
              type="datetime-local"
              required
              value={eventForm.startDate}
              onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
            />

            <Input
              label="End Date & Time (Optional)"
              type="datetime-local"
              value={eventForm.endDate}
              onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Max Seat Capacity"
              type="number"
              min="1"
              value={eventForm.capacity}
              onChange={(e) => setEventForm({ ...eventForm, capacity: Number(e.target.value) })}
            />

            {eventForm.mode === 'online' || eventForm.mode === 'hybrid' ? (
              <Input
                label="Meeting URL"
                placeholder="https://meet.google.com/xyz"
                value={eventForm.meetingLink}
                onChange={(e) => setEventForm({ ...eventForm, meetingLink: e.target.value })}
              />
            ) : (
              <Input
                label="Campus Venue / Room"
                placeholder="e.g. TCET Auditorium, 5th Floor"
                value={eventForm.venue}
                onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
              />
            )}
          </div>

          {/* Speaker Details (Optional) */}
          <div className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-surface-border)] space-y-3">
            <p className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-400" /> Featured Speaker Information (Optional)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Speaker Name"
                placeholder="e.g. Dr. Jane Doe"
                value={eventForm.speakerName}
                onChange={(e) => setEventForm({ ...eventForm, speakerName: e.target.value })}
              />
              <Input
                label="Designation / Company"
                placeholder="e.g. Staff Engineer @ Google"
                value={eventForm.speakerDesignation}
                onChange={(e) => setEventForm({ ...eventForm, speakerDesignation: e.target.value })}
              />
            </div>
            <Input
              label="Speaker Short Bio"
              placeholder="e.g. 10+ yrs in distributed systems and cloud architecture."
              value={eventForm.speakerBio}
              onChange={(e) => setEventForm({ ...eventForm, speakerBio: e.target.value })}
            />
          </div>

          <Textarea
            label="Event Overview & Agenda"
            required
            rows={4}
            placeholder="Describe the topics to be covered, timeline, key takeaways, and prerequisites..."
            value={eventForm.description}
            onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-surface-border)]">
            <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={creating}>
              Publish Event
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===== EVENT FEEDBACK MODAL ===== */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title={`Feedback: ${feedbackEvent?.title}`}
        size="md"
      >
        <form onSubmit={handleSubmitFeedback} className="space-y-4">
          <Select
            label="Rating"
            value={feedbackForm.rating}
            onChange={(e) => setFeedbackForm({ ...feedbackForm, rating: Number(e.target.value) })}
          >
            <option value="5">⭐⭐⭐⭐⭐ Excellent (5/5)</option>
            <option value="4">⭐⭐⭐⭐ Very Good (4/5)</option>
            <option value="3">⭐⭐⭐ Good (3/5)</option>
            <option value="2">⭐⭐ Fair (2/5)</option>
            <option value="1">⭐ Poor (1/5)</option>
          </Select>

          <Textarea
            label="Your Comments / Suggestions"
            rows={3}
            placeholder="What did you learn? Any takeaways or suggestions for future events?"
            value={feedbackForm.comment}
            onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowFeedbackModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Submit Feedback
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
