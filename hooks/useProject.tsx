'use client';

import { useState, useEffect, useCallback, useTransition, createContext, useContext, useRef, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Project } from '@/lib/types';
import { 
  getOrCreateCurrentProject, 
  saveProject as saveProjectAction,
  createProject as createProjectAction,
} from '@/lib/actions/project';

interface UseProjectReturn {
  project: Project | null;
  loading: boolean;
  updateProject: (updates: Partial<Project>) => void;
  updateProjectAndSave: (updates: Partial<Project>) => Promise<void>;
  resetProject: () => Promise<void>;
}

// Context for sharing project state across all pages
const ProjectContext = createContext<UseProjectReturn | null>(null);

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const { data: session, status } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  // Track if we've already loaded for this session to prevent re-fetching
  const hasLoadedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  // Load project when authenticated
  useEffect(() => {
    const userId = session?.user?.id;
    
    // Reset if user changed (logged out and back in as different user)
    if (userId !== lastUserIdRef.current) {
      hasLoadedRef.current = false;
      lastUserIdRef.current = userId || null;
    }
    
    // Reset state if explicitly not authenticated
    if (status === 'unauthenticated') {
      setProject(null);
      setLoading(false);
      hasLoadedRef.current = false;
      return;
    }
    
    // Already loaded for this user, skip
    if (hasLoadedRef.current && project) {
      setLoading(false);
      return;
    }

    async function loadProject() {
      try {
        const loaded = await getOrCreateCurrentProject();
        setProject(loaded);
        hasLoadedRef.current = true;
      } catch (err) {
        console.error('Failed to load project:', err);
        // Server will throw if not authenticated - that's fine, just stop loading
        setProject(null);
      } finally {
        setLoading(false);
      }
    }
    
    loadProject();
  }, [status, session?.user?.id]);

  // Debounced save
  useEffect(() => {
    if (!project) return;

    const timer = setTimeout(async () => {
      try {
        startTransition(async () => {
          await saveProjectAction(project.id, project);
        });
      } catch (err) {
        console.error('Failed to save project:', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [project]);

  const updateProject = useCallback((updates: Partial<Project>) => {
    setProject((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  // Immediate save - use when navigating away
  const updateProjectAndSave = useCallback(async (updates: Partial<Project>) => {
    setProject((prev) => {
      if (!prev) return prev;
      const updatedProject = { ...prev, ...updates };
      
      // Save immediately without debounce (fire and forget from state update)
      saveProjectAction(updatedProject.id, updatedProject).catch((err) => {
        console.error('Failed to save project:', err);
      });
      
      return updatedProject;
    });
  }, []);

  const resetProject = useCallback(async () => {
    setLoading(true);
    try {
      // Create a new project
      const fresh = await createProjectAction();
      setProject(fresh);
    } catch (err) {
      console.error('Failed to reset project:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const value: UseProjectReturn = {
    project,
    loading: loading || isPending,
    updateProject,
    updateProjectAndSave,
    resetProject,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): UseProjectReturn {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
