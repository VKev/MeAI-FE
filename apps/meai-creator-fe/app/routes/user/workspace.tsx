import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } from '@/services/client/workspace.client';
import type { Workspace, CreateWorkspaceInput, UpdateWorkspaceInput } from '@/models/workspace.model';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  MessageSquare,
  ShoppingBag,
  Lightbulb,
  Heart,
  Gamepad2,
  Music,
  Camera,
  Code,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bgImage: string; glowColor: string }> = {
  tech: {
    icon: Code,
    color: 'text-blue-400',
    bgImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80&auto=format&fit=crop',
    glowColor: 'rgba(59,130,246,0.5)'
  },
  lifestyle: {
    icon: Heart,
    color: 'text-pink-400',
    bgImage: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=600&q=80&auto=format&fit=crop',
    glowColor: 'rgba(236,72,153,0.5)'
  },
  business: {
    icon: Briefcase,
    color: 'text-amber-400',
    bgImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80&auto=format&fit=crop',
    glowColor: 'rgba(251,191,36,0.5)'
  },
  education: {
    icon: BookOpen,
    color: 'text-green-400',
    bgImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80&auto=format&fit=crop',
    glowColor: 'rgba(74,222,128,0.5)'
  },
  entertainment: {
    icon: Gamepad2,
    color: 'text-purple-400',
    bgImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80&auto=format&fit=crop',
    glowColor: 'rgba(192,132,252,0.5)'
  },
  music: {
    icon: Music,
    color: 'text-rose-400',
    bgImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80&auto=format&fit=crop',
    glowColor: 'rgba(251,113,133,0.5)'
  },
  photography: {
    icon: Camera,
    color: 'text-cyan-400',
    bgImage: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&q=80&auto=format&fit=crop',
    glowColor: 'rgba(34,211,238,0.5)'
  },
  shopping: {
    icon: ShoppingBag,
    color: 'text-orange-400',
    bgImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80&auto=format&fit=crop',
    glowColor: 'rgba(251,146,60,0.5)'
  },
  ideas: {
    icon: Lightbulb,
    color: 'text-yellow-400',
    bgImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80&auto=format&fit=crop',
    glowColor: 'rgba(250,204,21,0.5)'
  },
  social: {
    icon: MessageSquare,
    color: 'text-indigo-400',
    bgImage: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=600&q=80&auto=format&fit=crop',
    glowColor: 'rgba(129,140,248,0.5)'
  },
  others: {
    icon: FolderOpen,
    color: 'text-slate-400',
    bgImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&q=80&auto=format&fit=crop',
    glowColor: 'rgba(148,163,184,0.5)'
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

const WORKSPACE_TYPES = [
  { value: 'tech', label: 'Technology' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'business', label: 'Business' },
  { value: 'education', label: 'Education' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'music', label: 'Music' },
  { value: 'photography', label: 'Photography' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'ideas', label: 'Ideas' },
  { value: 'social', label: 'Social Media' },
  { value: 'others', label: 'Others' }
];

function getTypeConfig(type: string | null) {
  return TYPE_CONFIG[type || ''] || TYPE_CONFIG.others;
}

export default function WorkspacePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateWorkspaceInput>({
    name: '',
    type: '',
    description: ''
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => fetchWorkspaces()
  });

  const createMutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setIsCreateOpen(false);
      setActionError(null);
      resetForm();
      toast.success('Workspace created successfully');
    },
    onError: (error: any) => {
      const errData = error.response?.data;
      if (errData?.type === 'Subscription.Required') {
        setActionError(errData.detail || 'An active subscription is required to create a workspace.');
        toast.error(errData.detail || 'An active subscription is required to create a workspace.');
      } else if (error?.message?.includes('Subscription')) {
        setActionError(error.message);
        toast.error(error.message);
      } else {
        setActionError(error?.message || 'Failed to create workspace.');
        toast.error(error?.message || 'Failed to create workspace.');
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkspaceInput }) => updateWorkspace(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setIsEditOpen(false);
      setSelectedWorkspace(null);
      setActionError(null);
      resetForm();
      toast.success('Workspace updated successfully');
    },
    onError: () => {
      setActionError('Failed to update workspace.');
      toast.error('Failed to update workspace.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setIsDeleteOpen(false);
      setSelectedWorkspace(null);
      setActionError(null);
      toast.success('Workspace deleted successfully');
    },
    onError: () => {
      setActionError('Failed to delete workspace.');
      toast.error('Failed to delete workspace.');
    }
  });

  const resetForm = () => {
    setFormData({ name: '', type: '', description: '' });
  };

  const handleCreate = () => {
    if (!formData.name.trim()) return;
    createMutation.mutate({
      name: formData.name.trim(),
      type: formData.type || undefined,
      description: formData.description?.trim() || undefined
    });
  };

  const handleEdit = () => {
    if (!selectedWorkspace || !formData.name.trim()) return;
    updateMutation.mutate({
      id: selectedWorkspace.id,
      data: {
        name: formData.name.trim(),
        type: formData.type || undefined,
        description: formData.description?.trim() || undefined
      }
    });
  };

  const handleDelete = () => {
    if (!selectedWorkspace) return;
    deleteMutation.mutate(selectedWorkspace.id);
  };

  const openEditModal = (workspace: Workspace, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWorkspace(workspace);
    setFormData({
      name: workspace.name,
      type: workspace.type || '',
      description: workspace.description || ''
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (workspace: Workspace, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWorkspace(workspace);
    setIsDeleteOpen(true);
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    navigate(`/workspace/${workspace.id}`);
  };

  const workspaces = data?.value || [];

  return (
    <>
      <header className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-4'>
          <div className='flex h-11 w-11 items-center justify-center rounded-[12px] bg-white/[0.05] text-white/80'>
            <Briefcase className='h-5 w-5' />
          </div>

          <div className='space-y-0.5'>
            <h1 className='text-xl font-bold tracking-tight text-white'>Workspaces</h1>
            <p className='text-[11px] font-medium uppercase tracking-widest text-slate-500'>
              Create content workspaces organized by topic
            </p>
          </div>
        </div>
        {workspaces.length > 0 && (
          <Button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className='h-10 rounded-[14px] bg-white px-4 text-xs font-bold text-black hover:bg-white/90'
          >
            <Plus className='w-4 h-4 mr-2' />
            New Workspace
          </Button>
        )}
      </header>

      {actionError && (
        <div className='mb-6 rounded-[16px] bg-red-500/10 px-4 py-3 text-sm text-red-300'>
          {actionError}
        </div>
      )}

      {isLoading && (
        <div className='flex items-center justify-center text-white py-20'>
          <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mr-3'></div>
          Loading workspaces...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className='mx-auto mb-8 max-w-md rounded-[16px] bg-red-500/10 p-4 text-center text-red-400'>
          Error loading workspaces. Please try again.
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && workspaces.length === 0 && (
        <div className='flex flex-col items-center justify-center py-20'>
          <h2 className='text-xl font-semibold text-white mb-2'>No Workspaces Yet</h2>
          <p className='text-slate-400 text-center max-w-sm mb-6'>
            Create your first workspace to start generating AI-powered content for your social media.
          </p>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className='rounded-[14px] bg-white px-6 py-3 text-xs font-bold text-black hover:bg-white/90'
          >
            <Plus className='w-5 h-5 mr-2' />
            Create Your First Workspace
          </Button>
        </div>
      )}

      {/* Workspace Grid */}
      {!isLoading && !error && workspaces.length > 0 && (
        <motion.div
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {workspaces.map((workspace: Workspace) => {
            const config = getTypeConfig(workspace.type);
            const Icon = config.icon;

            return (
              <motion.div
                key={workspace.id}
                variants={cardVariants}
                onClick={() => handleWorkspaceClick(workspace)}
                className='group relative min-h-[220px] cursor-pointer overflow-hidden rounded-[24px] bg-white/[0.035] transition-colors duration-200 hover:bg-white/[0.055]'
              >
                <div
                  className='absolute inset-x-0 top-0 h-28 opacity-70'
                  style={{
                    backgroundImage: `url(${config.bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />

                <div className='absolute inset-0 bg-gradient-to-b from-black/10 via-[#080a12]/70 to-[#080a12]'></div>
                <div className='relative z-10 flex min-h-[220px] flex-col justify-between p-5'>
                  <div className='flex items-start justify-between mb-4'>
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/[0.08] ${config.color}`}
                    >
                      <Icon className='w-6 h-6' />
                    </div>
                    <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                      <button
                        onClick={(e) => openEditModal(workspace, e)}
                        className='p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-slate-400 hover:text-white transition-colors'
                      >
                        <Pencil className='w-4 h-4' />
                      </button>
                      <button
                        onClick={(e) => openDeleteModal(workspace, e)}
                        className='p-2 rounded-lg bg-neutral-800/80 hover:bg-red-600/20 text-slate-400 hover:text-red-400 transition-colors'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </div>

                  <h3 className='text-lg font-semibold text-white mb-2'>{workspace.name}</h3>

                  {workspace.type && (
                    <span
                      className={`mb-3 inline-block rounded-[10px] bg-white/[0.07] px-2.5 py-1 text-xs font-medium ${config.color}`}
                    >
                      {WORKSPACE_TYPES.find((t) => t.value === workspace.type)?.label || workspace.type}
                    </span>
                  )}

                  {workspace.description && (
                    <p className='text-slate-400 text-sm line-clamp-2'>{workspace.description}</p>
                  )}
                  {workspace.createdAt && (
                    <p className='text-slate-200 text-sm mt-4'>
                      Created {new Date(workspace.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className='border-none bg-[#080a12] text-white shadow-none sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Set up a new workspace to organize your AI-generated content by topic.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <label htmlFor='name' className='text-sm font-medium text-slate-300'>
                Workspace Name
              </label>
              <Input
                id='name'
                placeholder='e.g., Tech Reviews, Lifestyle Tips'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className='!border-0 bg-white/[0.05] text-white placeholder:text-slate-500 focus-visible:ring-violet-500/40'
              />
            </div>
            <div className='grid gap-2'>
              <label htmlFor='type' className='text-sm font-medium text-slate-300'>
                Type / Category
              </label>
              <select
                id='type'
                value={formData.type || ''}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className='h-10 w-full rounded-[12px] border-0 bg-white/[0.05] px-3 py-1 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/40'
              >
                <option value=''>Select a type...</option>
                {WORKSPACE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className='grid gap-2'>
              <label htmlFor='description' className='text-sm font-medium text-slate-300'>
                Description (optional)
              </label>
              <textarea
                id='description'
                placeholder='What kind of content will this workspace create?'
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className='w-full resize-none rounded-[12px] border-0 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-violet-500/40'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='ghost'
              onClick={() => setIsCreateOpen(false)}
              className='rounded-[14px] text-slate-300 hover:bg-white/[0.05] hover:text-white'
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name.trim() || createMutation.isPending}
              className='rounded-[14px] bg-white text-black hover:bg-white/90'
            >
              {createMutation.isPending ? 'Creating...' : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className='border-none bg-[#080a12] text-white shadow-none sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>Update your workspace details.</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <label htmlFor='edit-name' className='text-sm font-medium text-slate-300'>
                Workspace Name
              </label>
              <Input
                id='edit-name'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className='!border-0 bg-white/[0.05] text-white focus-visible:ring-violet-500/40'
              />
            </div>
            <div className='grid gap-2'>
              <label htmlFor='edit-type' className='text-sm font-medium text-slate-300'>
                Type / Category
              </label>
              <select
                id='edit-type'
                value={formData.type || ''}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className='h-10 w-full rounded-[12px] border-0 bg-white/[0.05] px-3 py-1 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/40'
              >
                <option value=''>Select a type...</option>
                {WORKSPACE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className='grid gap-2'>
              <label htmlFor='edit-description' className='text-sm font-medium text-slate-300'>
                Description
              </label>
              <textarea
                id='edit-description'
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className='w-full resize-none rounded-[12px] border-0 bg-white/[0.05] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/40'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='ghost'
              onClick={() => setIsEditOpen(false)}
              className='rounded-[14px] text-slate-300 hover:bg-white/[0.05] hover:text-white'
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!formData.name.trim() || updateMutation.isPending}
              className='rounded-[14px] bg-white text-black hover:bg-white/90'
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedWorkspace?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='ghost'
              onClick={() => setIsDeleteOpen(false)}
              className='text-slate-300 hover:text-white hover:bg-neutral-700'
            >
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
