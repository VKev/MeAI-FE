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
  Sparkles,
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
  tech: { icon: Code, color: 'text-blue-400', bgImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80&auto=format&fit=crop', glowColor: 'rgba(59,130,246,0.5)' },
  lifestyle: { icon: Heart, color: 'text-pink-400', bgImage: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=600&q=80&auto=format&fit=crop', glowColor: 'rgba(236,72,153,0.5)' },
  business: { icon: Briefcase, color: 'text-amber-400', bgImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80&auto=format&fit=crop', glowColor: 'rgba(251,191,36,0.5)' },
  education: { icon: BookOpen, color: 'text-green-400', bgImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80&auto=format&fit=crop', glowColor: 'rgba(74,222,128,0.5)' },
  entertainment: { icon: Gamepad2, color: 'text-purple-400', bgImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80&auto=format&fit=crop', glowColor: 'rgba(192,132,252,0.5)' },
  music: { icon: Music, color: 'text-rose-400', bgImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80&auto=format&fit=crop', glowColor: 'rgba(251,113,133,0.5)' },
  photography: { icon: Camera, color: 'text-cyan-400', bgImage: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&q=80&auto=format&fit=crop', glowColor: 'rgba(34,211,238,0.5)' },
  shopping: { icon: ShoppingBag, color: 'text-orange-400', bgImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80&auto=format&fit=crop', glowColor: 'rgba(251,146,60,0.5)' },
  ideas: { icon: Lightbulb, color: 'text-yellow-400', bgImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80&auto=format&fit=crop', glowColor: 'rgba(250,204,21,0.5)' },
  social: { icon: MessageSquare, color: 'text-indigo-400', bgImage: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=600&q=80&auto=format&fit=crop', glowColor: 'rgba(129,140,248,0.5)' },
  others: { icon: FolderOpen, color: 'text-slate-400', bgImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&q=80&auto=format&fit=crop', glowColor: 'rgba(148,163,184,0.5)' }
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
      resetForm();
      toast.success('Workspace created successfully');
    },
    onError: (error: any) => {
      if (error?.message?.includes('Subscription')) {
        toast.error(error.message);
      } else {
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
      resetForm();
      toast.success('Workspace updated successfully');
    },
    onError: () => {
      toast.error('Failed to update workspace.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setIsDeleteOpen(false);
      setSelectedWorkspace(null);
      toast.success('Workspace deleted successfully');
    },
    onError: () => {
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
    <div className='min-h-screen py-8 px-6 relative overflow-hidden'>
      <div className='absolute inset-0 -z-10'>
        <div className='absolute inset-0 bg-gradient-to-br from-violet-900/10 via-transparent to-purple-900/10 animate-pulse' style={{ animationDuration: '4s' }}></div>
        <div className='absolute top-10 left-1/3 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl animate-pulse' style={{ animationDuration: '6s' }}></div>
        <div className='absolute bottom-10 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse' style={{ animationDuration: '8s', animationDelay: '2s' }}></div>
      </div>
      <div className='mb-10'>
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center'>
              <Briefcase className='w-5 h-5 text-white' />
            </div>
            <h1 className='text-2xl font-bold text-white'>Workspaces</h1>
          </div>
          {workspaces.length > 0 && (
            <Button
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
              className='bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700'
            >
              <Plus className='w-4 h-4 mr-2' />
              New Workspace
            </Button>
          )}
        </div>
        <p className='text-slate-400 ml-13'>
          Create content workspaces organized by topic. AI will help you generate and auto-post content to your social
          media.
        </p>
      </div>

      {isLoading && (
        <div className='flex items-center justify-center text-white py-20'>
          <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mr-3'></div>
          Loading workspaces...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className='max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center'>
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
            className='bg-linear-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 px-6 py-3'
          >
            <Plus className='w-5 h-5 mr-2' />
            Create Your First Workspace
          </Button>
        </div>
      )}

      {/* Workspace Grid */}
      {!isLoading && !error && workspaces.length > 0 && (
        <motion.div
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ml-6'
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
                className='relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02]'
                style={{
                  backgroundImage: `url(${config.bgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                whileHover={{
                  boxShadow: `0 0 30px ${config.glowColor}, 0 0 60px ${config.glowColor.replace('0.5', '0.2')}`
                }}
              >
                <div className='absolute inset-0 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors duration-300 z-20 pointer-events-none'></div>

                <div className='absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/40'></div>
                <div className='relative z-10 p-6'>
                  <div className='flex items-start justify-between mb-4'>
                    <div
                      className={`w-12 h-12 rounded-xl bg-neutral-800/50 flex items-center justify-center ${config.color}`}
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
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${config.color} bg-neutral-800/50 mb-3`}
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
        <DialogContent className='sm:max-w-md'>
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
                className='bg-neutral-800 border-neutral-700 text-white placeholder:text-slate-500'
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
                className='h-9 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1 text-sm text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
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
                className='w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='ghost'
              onClick={() => setIsCreateOpen(false)}
              className='text-slate-300 hover:text-white hover:bg-neutral-700'
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name.trim() || createMutation.isPending}
              className='bg-gradient-to-r from-violet-600 to-purple-600 text-white'
            >
              {createMutation.isPending ? 'Creating...' : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className='sm:max-w-md'>
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
                className='bg-neutral-800 border-neutral-700 text-white'
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
                className='h-9 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1 text-sm text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
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
                className='w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='ghost'
              onClick={() => setIsEditOpen(false)}
              className='text-slate-300 hover:text-white hover:bg-neutral-700'
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!formData.name.trim() || updateMutation.isPending}
              className='bg-gradient-to-r from-violet-600 to-purple-600 text-white'
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
    </div>
  );
}
