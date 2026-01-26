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
  const isLoadingRef = useRef(false); // Prevent duplicate concurrent loads

  // Load project on mount and when user changes
  useEffect(() => {
    const userId = session?.user?.id;
    
    // Only reset if user explicitly changed to a DIFFERENT user (not just undefined)
    // This prevents resetting during hydration when session is briefly unavailable
    if (userId && lastUserIdRef.current && userId !== lastUserIdRef.current) {
      hasLoadedRef.current = false;
      setProject(null);
    }
    if (userId) {
      lastUserIdRef.current = userId;
    }
    
    // Reset state if explicitly logged out
    if (status === 'unauthenticated') {
      setProject(null);
      setLoading(false);
      hasLoadedRef.current = false;
      lastUserIdRef.current = null;
      return;
    }
    
    // Already loaded or currently loading, don't reload
    if (hasLoadedRef.current || isLoadingRef.current) {
      setLoading(false);
      return;
    }

    async function loadProject() {
      if (isLoadingRef.current) return; // Extra guard
      isLoadingRef.current = true;
      
      try {
        const loaded = await getOrCreateCurrentProject();
        setProject(loaded);
        hasLoadedRef.current = true;
      } catch (err) {
        console.error('Failed to load project:', err);
        setProject(null);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    }
    
    loadProject();
  }, [status, session?.user?.id]); // Removed 'loading' from deps - it was causing feedback loop

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
