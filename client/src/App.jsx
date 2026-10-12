import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Download,
  Mail,
  Globe,
  Building2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Database,
  ArrowRight,
  Layers,
  FileSpreadsheet,
  Edit3,
  X,
  AlertCircle
} from 'lucide-react';

const PRESETS = [
  {
    title: 'EdTech in India',
    product: 'AI-powered student attendance software',
    country: 'India',
    industry: 'Education / Schools',
    icon: '🎓'
  },
  {
    title: 'HealthTech in United States',
    product: 'Cloud-based automated clinical triage & patient scheduling',
    country: 'United States',
    industry: 'Healthcare / Hospitals',
    icon: '🏥'
  },
  {
    title: 'HRTech in United Kingdom',
    product: 'AI talent acquisition & automated interview screening suite',
    country: 'United Kingdom',
    industry: 'Human Resources / Recruitment',
    icon: '💼'
  }
];

export default function App() {
  // Campaign input state
  const [productDescription, setProductDescription] = useState('AI-powered student attendance software');
  const [country, setCountry] = useState('India');
  const [industry, setIndustry] = useState('Education / Schools');
  const [numberOfLeads, setNumberOfLeads] = useState(5);

  // Leads and UI states
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dbInfo, setDbInfo] = useState({ mode: 'Loading...', isMongoConnected: false });

  // Email outreach modal state
  const [activeLead, setActiveLead] = useState(null);
  const [modalSubject, setModalSubject] = useState('');
  const [modalBody, setModalBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState('');

  // Fetch leads and system status on mount
  useEffect(() => {
    fetchLeads();
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.db) setDbInfo(data.db);
    } catch (e) {
      console.warn('Health check failed', e);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Failed to fetch leads', err);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!productDescription || !country || !industry) {
      setError('Please fill in all campaign parameters.');
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStep('Discovering verified target organizations in ' + country + '...');

    const timer = setTimeout(() => {
      setLoadingStep('Synthesizing customized B2B outreach emails & CTAs...');
    }, 4500);

    try {
      const res = await fetch('/api/campaigns/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription,
          country,
          industry,
          numberOfLeads: parseInt(numberOfLeads) || 5
        })
      });

      const data = await res.json();
      clearTimeout(timer);

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to generate leads.');
      }

      await fetchLeads();
      setLoadingStep('');
    } catch (err) {
      clearTimeout(timer);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleStatusToggle = async (lead) => {
    try {
      const id = lead._id || lead.id;
      const res = await fetch(`/api/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        fetchLeads();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const openOutreachModal = (lead) => {
    setActiveLead(lead);
    setModalSubject(lead.emailSubject || '');
    setModalBody(lead.emailBody || '');
    setSendSuccessMsg('');
  };

  const handleSendEmail = async () => {
    if (!activeLead) return;
    setSendingEmail(true);
    setSendSuccessMsg('');
    try {
      const id = activeLead._id || activeLead.id;
      const res = await fetch(`/api/leads/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: modalSubject,
          body: modalBody
        })
      });
      const data = await res.json();
      if (data.success) {
        setSendSuccessMsg('Email dispatched successfully! Status updated to "Contacted".');
        fetchLeads();
        setTimeout(() => {
          setActiveLead(null);
        }, 1800);
      }
    } catch (err) {
      alert('Error sending email: ' + err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleBulkSend = async () => {
    if (!window.confirm('Send personalized outreach to all "Not Contacted" leads?')) return;
    try {
      const res = await fetch('/api/leads/bulk-send', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchLeads();
      }
    } catch (err) {
      alert('Bulk send failed: ' + err.message);
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      fetchLeads();
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all leads from the database?')) return;
    try {
      await fetch('/api/leads/all', { method: 'DELETE' });
      fetchLeads();
    } catch (err) {
      console.error('Clear error', err);
    }
  };

  const applyPreset = (preset) => {
    setProductDescription(preset.product);
    setCountry(preset.country);
    setIndustry(preset.industry);
  };

  // Filtered leads
  const filteredLeads = leads.filter((l) => {
    const matchesStatus =
      statusFilter === 'All' ? true : l.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (l.organizationName && l.organizationName.toLowerCase().includes(q)) ||
      (l.industry && l.industry.toLowerCase().includes(q)) ||
      (l.contactEmail && l.contactEmail.toLowerCase().includes(q)) ||
      (l.country && l.country.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const contactedCount = leads.filter((l) => l.status === 'Contacted').length;
  const pendingCount = leads.length - contactedCount;
  const contactRate = leads.length > 0 ? Math.round((contactedCount / leads.length) * 100) : 0;

  return (
    <div className="app-shell" style={{ minHeight: '100vh', padding: '1.5rem 2rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Navbar */}
      <header
        className="glass-panel"
        style={{
          padding: '1rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #86efac 0%, #4ade80 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(34, 197, 94, 0.25)'
            }}
          >
            <Sparkles size={22} color="#14532d" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Outbound Lead Generator
              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: '#dcfce7', color: '#166534', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Agency Suite
              </span>
            </h1>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Autonomous Prospect Discovery, Verified Intelligence & Cold Outreach Automation
            </p>
          </div>
        </div>

        {/* Database & Stack Info Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '0.4rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.775rem'
            }}
          >
            <Database size={14} color="#22c55e" />
            <span style={{ color: 'var(--text-secondary)' }}>MERN Store:</span>
            <span style={{ color: '#15803d', fontWeight: 600 }}>{dbInfo.mode}</span>
          </div>

          <a
            href="/api/leads/export/csv"
            download="outbound_leads_export.csv"
            className="btn btn-emerald btn-sm"
            title="Download formatted CSV matching client specifications"
          >
            <FileSpreadsheet size={15} />
            Export CSV / Sheets
          </a>
        </div>
      </header>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Discovered</span>
            <Layers size={18} color="#22c55e" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800 }}>{leads.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified targeted accounts</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Not Contacted</span>
            <Clock size={18} color="#b45309" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#b45309' }}>{pendingCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending outbound initiation</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Contacted Leads</span>
            <CheckCircle2 size={18} color="#22c55e" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#15803d' }}>{contactedCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Outreach emails dispatched</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Outreach Velocity</span>
            <Send size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16a34a' }}>{contactRate}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Campaign completion rate</div>
        </div>
      </div>

      {/* Main Split Grid: Input Panel & Leads List */}
      <div className="main-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column: Campaign Input Form */}
        <div className="glass-panel campaign-panel" style={{ padding: '1.5rem', position: 'sticky', top: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Sparkles size={18} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>1. Campaign Input</h2>
          </div>

          {/* Quick Presets from Assignment */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
              Quick Startup Scenarios:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = '#bbf7d0')}
                >
                  <span>{p.icon} {p.title}</span>
                  <ArrowRight size={12} color="var(--text-muted)" />
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleGenerate}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                Product Description *
              </label>
              <textarea
                rows={3}
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="What does the SaaS startup offer? (e.g. AI-powered student attendance software)"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Target Country *
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. India, United States"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Target Industry *
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Education / Schools"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                Number of Leads
              </label>
              <select
                value={numberOfLeads}
                onChange={(e) => setNumberOfLeads(e.target.value)}
              >
                <option value={3}>3 Leads (Fast Demo)</option>
                <option value={5}>5 Leads</option>
                <option value={10}>10 Leads (Default Spec)</option>
                <option value={15}>15 Leads</option>
              </select>
            </div>

            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  color: '#b91c1c',
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', fontSize: '0.925rem' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Processing Pipeline...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Leads & Outreach
                </>
              )}
            </button>
          </form>

          {loadingStep && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.85rem',
                borderRadius: '8px',
                background: '#f0fdf4',
                border: '1px solid #86efac',
                fontSize: '0.8rem',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
              {loadingStep}
            </div>
          )}
        </div>

        {/* Right Column: Lead Database & Outreach View */}
        <div>
          {/* Controls bar */}
          <div
            className="glass-panel"
            style={{
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            {/* Search Input */}
            <div className="search-control" style={{ position: 'relative', minWidth: '220px', flex: '1' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search leads by name, email, or country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2rem' }}
              />
            </div>

            {/* Status Filter Pills */}
            <div style={{ display: 'flex', gap: '0.35rem', background: '#f0fdf4', padding: '0.25rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              {['All', 'Not Contacted', 'Contacted'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    border: 'none',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.775rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: statusFilter === st ? 'var(--accent-primary)' : 'transparent',
                    color: statusFilter === st ? '#14532d' : 'var(--text-secondary)'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleBulkSend}
                disabled={pendingCount === 0}
                className="btn btn-secondary btn-sm"
                title="Bulk initiate outreach to all pending leads"
              >
                <Send size={13} color="#16a34a" />
                Dispatch All Pending
              </button>

              {leads.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#f87171' }}
                  title="Clear all leads"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Lead List / Cards */}
          {filteredLeads.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                padding: '3.5rem 2rem',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}
            >
              <Building2 size={44} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                {leads.length === 0 ? 'No leads generated yet' : 'No matching leads found'}
              </h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
                {leads.length === 0
                  ? 'Fill out the campaign parameters on the left and click "Generate Leads & Outreach" to discover target organizations.'
                  : 'Try clearing your search query or switching filters.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredLeads.map((lead) => {
                const isContacted = lead.status === 'Contacted';
                const id = lead._id || lead.id;

                return (
                  <div
                    key={id}
                    className="glass-panel animate-fade-in"
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderLeft: `4px solid ${isContacted ? 'var(--emerald-main)' : 'var(--amber-main)'}`,
                      transition: 'transform 0.2s ease, border-color 0.2s ease'
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {lead.organizationName}
                          </h3>
                          <span className={`badge ${isContacted ? 'badge-contacted' : 'badge-not-contacted'}`}>
                            {isContacted ? 'Contacted' : 'Not Contacted'}
                          </span>
                        </div>

                        {/* Meta items */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {lead.website && (
                            <a
                              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#15803d', textDecoration: 'none' }}
                            >
                              <Globe size={13} />
                              {lead.website.replace(/^https?:\/\/(www\.)?/, '')}
                              <ExternalLink size={11} />
                            </a>
                          )}
                          <span>📍 {lead.country}</span>
                          <span>🏢 {lead.industry}</span>
                          {lead.contactEmail && (
                            <span style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Mail size={13} color="#6b8a76" />
                              {lead.contactEmail}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="lead-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => openOutreachModal(lead)}
                          className="btn btn-primary btn-sm"
                          title="Preview and send personalized cold outreach"
                        >
                          <Mail size={13} />
                          Review & Send Outreach
                        </button>

                        <button
                          onClick={() => handleStatusToggle(lead)}
                          className={`btn btn-sm ${isContacted ? 'btn-secondary' : 'btn-emerald'}`}
                          title="Toggle between Contacted and Not Contacted"
                        >
                          {isContacted ? 'Mark Not Contacted' : 'Mark Contacted'}
                        </button>

                        <button
                          onClick={() => handleDeleteLead(id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#ef4444', padding: '0.4rem' }}
                          title="Delete Lead"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: 1.5 }}>
                      {lead.description}
                    </p>

                    {/* Source URL & Outreach Preview Snippet */}
                    <div
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #d1fae5',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ color: '#15803d', fontWeight: 600 }}>
                          ✉️ Subject: "{lead.emailSubject}"
                        </span>
                        {lead.sourceUrl && (
                          <a
                            href={lead.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', fontSize: '0.75rem' }}
                          >
                            Source Link <ExternalLink size={11} />
                          </a>
                        )}
                      </div>

                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.775rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lead.emailBody?.substring(0, 160)}...
                      </div>

                      {lead.contactedAt && (
                        <div style={{ marginTop: '0.4rem', fontSize: '0.725rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CheckCircle2 size={12} /> Contacted on: {new Date(lead.contactedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Outreach Email Modal */}
      {activeLead && (
        <div className="modal-overlay">
          <div
            className="glass-panel animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '680px',
              padding: '1.75rem',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={20} color="var(--accent-primary)" />
                  Personalized Outreach Email
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Target: <strong style={{ color: 'var(--text-primary)' }}>{activeLead.organizationName}</strong> ({activeLead.contactEmail || 'No email specified'})
                </p>
              </div>
              <button
                onClick={() => setActiveLead(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Email Form */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Subject Line
              </label>
              <input
                type="text"
                value={modalSubject}
                onChange={(e) => setModalSubject(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Email Body
              </label>
              <textarea
                rows={9}
                value={modalBody}
                onChange={(e) => setModalBody(e.target.value)}
                style={{ fontFamily: 'inherit', lineHeight: 1.6 }}
              />
            </div>

            {activeLead.callToAction && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.8rem',
                  marginBottom: '1.25rem',
                  color: '#15803d'
                }}
              >
                <strong>🎯 Call to Action:</strong> {activeLead.callToAction}
              </div>
            )}

            {sendSuccessMsg && (
              <div
                style={{
                  background: 'var(--emerald-bg)',
                  border: '1px solid var(--emerald-border)',
                  color: '#15803d',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <CheckCircle2 size={16} />
                {sendSuccessMsg}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
              <a
                href={`mailto:${activeLead.contactEmail || ''}?subject=${encodeURIComponent(modalSubject)}&body=${encodeURIComponent(modalBody)}`}
                className="btn btn-secondary btn-sm"
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={13} />
                Launch Mail Client (Mailto)
              </a>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveLead(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="btn btn-primary"
                >
                  {sendingEmail ? (
                    'Dispatching...'
                  ) : (
                    <>
                      <Send size={15} />
                      Send & Mark Contacted
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation Keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
