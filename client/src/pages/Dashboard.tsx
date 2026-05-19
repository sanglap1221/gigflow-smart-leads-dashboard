import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  TrendingUp,
  UserCheck,
  Award,
  Users2,
  Loader2,
} from 'lucide-react';
import type { Lead, LeadStatus } from '../types';

// Form validation schema
const leadFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'WON']),
  source: z.enum(['Web', 'Referral', 'Cold Call', 'Social Media', 'Other']),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

export const Dashboard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      status: 'NEW',
      source: 'Other',
      assignedTo: '',
      notes: '',
    },
  });

  // Query: Get team users (for assign dropdown - ADMIN/MANAGER only)
  const { data: teamUsersResponse } = useQuery({
    queryKey: ['team-users'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/users');
      return response.data.data;
    },
    enabled: user?.role === 'ADMIN' || user?.role === 'MANAGER',
  });

  const teamUsers = teamUsersResponse || [];

  // Query: Get Leads
  const { data: leadsResponse, isLoading, isError } = useQuery({
    queryKey: [
      'leads',
      page,
      statusFilter,
      sourceFilter,
      assignedFilter,
      searchTerm,
    ],
    queryFn: async () => {
      const response = await apiClient.get('/leads', {
        params: {
          page,
          limit,
          status: statusFilter || undefined,
          source: sourceFilter || undefined,
          assignedTo: assignedFilter || undefined,
          search: searchTerm || undefined,
        },
      });
      return response.data;
    },
  });

  const leads = leadsResponse?.data || [];
  const pagination = leadsResponse?.pagination;

  // Mutations
  const createLeadMutation = useMutation({
    mutationFn: async (newLead: LeadFormValues) => {
      const response = await apiClient.post('/leads', newLead);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead created successfully!');
      handleCloseModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create lead');
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LeadFormValues }) => {
      const response = await apiClient.put(`/leads/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead updated successfully!');
      handleCloseModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update lead');
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead deleted successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete lead');
    },
  });

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingLead(null);
    reset({
      name: '',
      email: '',
      phone: '',
      status: 'NEW',
      source: 'Web',
      assignedTo: user?.role === 'USER' ? user.id : '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lead: Lead) => {
    setEditingLead(lead);
    reset({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      status: lead.status,
      source: lead.source,
      assignedTo: lead.assignedTo?._id || '',
      notes: lead.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLead(null);
  };

  const onSubmit = (values: LeadFormValues) => {
    const payload = {
      ...values,
      // If it's an empty string and not set, pass undefined to Mongoose
      assignedTo: values.assignedTo || undefined,
    };

    if (editingLead) {
      updateLeadMutation.mutate({ id: editingLead._id, data: payload });
    } else {
      createLeadMutation.mutate(payload);
    }
  };

  const handleDeleteLead = (id: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      deleteLeadMutation.mutate(id);
    }
  };

  const handleCSVExport = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (sourceFilter) params.append('source', sourceFilter);
    if (assignedFilter) params.append('assignedTo', assignedFilter);
    if (searchTerm) params.append('search', searchTerm);

    // Trigger download by opening it in a new window/iframe, Axios withCredentials isn't easily supported by normal anchor tags,
    // so we fetch it as a blob and save it locally! That is extremely robust and bypasses auth header issues.
    toast.promise(
      apiClient
        .get(`/leads/export?${params.toString()}`, { responseType: 'blob' })
        .then((res) => {
          const blob = new Blob([res.data], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `leads_export_${Date.now()}.csv`);
          document.body.appendChild(link);
          link.click();
          link.remove();
        }),
      {
        loading: 'Preparing lead export...',
        success: 'Leads exported successfully!',
        error: 'Failed to export leads',
      }
    );
  };

  // Status Badge Helper
  const getStatusBadge = (status: LeadStatus) => {
    const badges = {
      NEW: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      CONTACTED: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      QUALIFIED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      LOST: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      WON: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
    return badges[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  // Stats Calculations (mocked or aggregated from query response if full database stats aren't exposed, but we can compute from currently active list or query totals)
  // Actually, computing stats based on current query makes sense, or we can fetch/calculate simple aggregates.
  // Let's count status stats from currently retrieved leads for quick UI display.
  const totalLeads = pagination?.total || 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Upper header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
            Leads Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track, filter, export, and assign sales leads dynamically.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCSVExport}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-sm transition cursor-pointer"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm shadow-md shadow-indigo-500/10 transition cursor-pointer"
          >
            <Plus size={16} />
            Add Lead
          </button>
        </div>
      </div>

      {/* Analytics stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
            <Users2 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Leads
            </p>
            <p className="text-2xl font-bold text-slate-200 mt-1">
              {totalLeads}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              New Leads
            </p>
            <p className="text-2xl font-bold text-slate-200 mt-1">
              {leads.filter((l: Lead) => l.status === 'NEW').length}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Qualified Leads
            </p>
            <p className="text-2xl font-bold text-slate-200 mt-1">
              {leads.filter((l: Lead) => l.status === 'QUALIFIED').length}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Leads Won
            </p>
            <p className="text-2xl font-bold text-slate-200 mt-1">
              {leads.filter((l: Lead) => l.status === 'WON').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/20 border border-slate-800/60 rounded-2xl p-4 flex flex-col lg:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative w-full lg:flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search by lead name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl py-2 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/60 transition"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:flex items-center gap-3 w-full lg:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950/50 border border-slate-800/80 rounded-xl py-2 px-3 text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/60 cursor-pointer appearance-none min-w-[120px]"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="LOST">Lost</option>
            <option value="WON">Won</option>
          </select>

          {/* Source filter */}
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950/50 border border-slate-800/80 rounded-xl py-2 px-3 text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/60 cursor-pointer appearance-none min-w-[120px]"
          >
            <option value="">All Sources</option>
            <option value="Web">Web</option>
            <option value="Referral">Referral</option>
            <option value="Cold Call">Cold Call</option>
            <option value="Social Media">Social Media</option>
            <option value="Other">Other</option>
          </select>

          {/* Assigned filter (ADMIN/MANAGER only) */}
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <select
              value={assignedFilter}
              onChange={(e) => {
                setAssignedFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950/50 border border-slate-800/80 rounded-xl py-2 px-3 text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/60 cursor-pointer appearance-none col-span-2 sm:col-span-1 min-w-[140px]"
            >
              <option value="">All Assignees</option>
              {teamUsers.map((u: any) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Table view */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Email / Phone</th>
                <th className="py-4 px-6">Source</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Assigned To</th>
                <th className="py-4 px-6">Created Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 text-slate-300 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-indigo-500" size={24} />
                      <span>Loading leads...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-rose-400 font-semibold"
                  >
                    Error loading leads. Please check connection or reload.
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No leads found matching current criteria.
                  </td>
                </tr>
              ) : (
                leads.map((lead: Lead) => (
                  <tr
                    key={lead._id}
                    className="hover:bg-slate-900/20 transition-colors"
                  >
                    <td className="py-4 px-6 font-semibold text-slate-200">
                      {lead.name}
                    </td>
                    <td className="py-4 px-6">
                      <div>{lead.email}</div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        {lead.phone || 'No phone'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-400 text-xs font-semibold">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                          lead.status
                        )}`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {lead.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                            {lead.assignedTo.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">
                              {lead.assignedTo.name}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(lead.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(lead)}
                          className="p-1.5 rounded-lg bg-slate-800/40 border border-slate-700/40 text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition cursor-pointer"
                        >
                          <Edit2 size={14} />
                        </button>
                        {/* Only ADMIN and MANAGER can delete leads */}
                        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                          <button
                            onClick={() => handleDeleteLead(lead._id)}
                            className="p-1.5 rounded-lg bg-slate-800/40 border border-slate-700/40 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {pagination && pagination.pages > 1 && (
          <div className="border-t border-slate-800/80 bg-slate-900/30 py-4 px-6 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing page <strong className="text-slate-400">{page}</strong> of{' '}
              <strong className="text-slate-400">{pagination.pages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-slate-950/60 cursor-pointer transition"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-slate-950/60 cursor-pointer transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-850 p-6 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-slate-100 mb-6">
              {editingLead ? 'Edit Lead Details' : 'Create New Lead'}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Lead Name
                </label>
                <input
                  type="text"
                  placeholder="Lead full name"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3.5 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/60 transition"
                  {...register('name')}
                />
                {errors.name && (
                  <span className="text-xs text-rose-400 font-medium">
                    {errors.name.message}
                  </span>
                )}
              </div>

              {/* Email & Phone grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3.5 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/60 transition"
                    {...register('email')}
                  />
                  {errors.email && (
                    <span className="text-xs text-rose-400 font-medium">
                      {errors.email.message}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3.5 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/60 transition"
                    {...register('phone')}
                  />
                </div>
              </div>

              {/* Status & Source grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Lead Status
                  </label>
                  <select
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/60 transition appearance-none cursor-pointer"
                    {...register('status')}
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="LOST">Lost</option>
                    <option value="WON">Won</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Lead Source
                  </label>
                  <select
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/60 transition appearance-none cursor-pointer"
                    {...register('source')}
                  >
                    <option value="Web">Web</option>
                    <option value="Referral">Referral</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Assign To (ADMIN/MANAGER only) */}
              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Assigned Agent
                  </label>
                  <select
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/60 transition appearance-none cursor-pointer"
                    {...register('assignedTo')}
                  >
                    <option value="">Unassigned</option>
                    {teamUsers.map((u: any) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Lead Notes
                </label>
                <textarea
                  placeholder="Enter details, follow-up timeline, or deal info..."
                  rows={3}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3.5 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/60 transition resize-none"
                  {...register('notes')}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold py-2 px-4 rounded-xl text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createLeadMutation.isPending ||
                    updateLeadMutation.isPending
                  }
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2 px-5 rounded-xl text-sm shadow-md shadow-indigo-500/10 transition cursor-pointer flex items-center gap-1.5"
                >
                  {(createLeadMutation.isPending ||
                    updateLeadMutation.isPending) && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {editingLead ? 'Save Changes' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
