'use client';

import { useState, useEffect, useCallback, createContext, useContext, useRef, ReactNode } from 'react';
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
  const [showLoading, setShowLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('init');
  
  // Track if we've already loaded for this session to prevent re-fetching
  const hasLoadedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  // Delay showing loading indicator by 300ms to avoid flash for fast loads
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShowLoading(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowLoading(false);
    }
  }, [loading]);

  // Load project on mount and when user changes
  useEffect(() => {
    const userId = session?.user?.id;
    
    // Wait for session to resolve before doing anything
    if (status === 'loading') {
      setDebugInfo('waiting for session');
      return;
    }
    
    // Reset state if logged out
    if (status === 'unauthenticated') {
      setDebugInfo('unauthenticated');
      setProject(null);
      setLoading(false);
      hasLoadedRef.current = false;
      lastUserIdRef.current = null;
      return;
    }
    
    // From here, status is 'authenticated'
    setDebugInfo(`auth ok, hasLoaded=${hasLoadedRef.current}, isLoading=${isLoadingRef.current}`);
    
    // Reset if user changed to a DIFFERENT user
    if (userId && lastUserIdRef.current && userId !== lastUserIdRef.current) {
      hasLoadedRef.current = false;
      setProject(null);
    }
    if (userId) {
      lastUserIdRef.current = userId;
    }
    
    // Currently loading, let it finish
    if (isLoadingRef.current) {
      setDebugInfo('already loading, skip');
      return;
    }
    
    // Already loaded
    if (hasLoadedRef.current) {
      setDebugInfo('already loaded');
      if (loading) setLoading(false);
      return;
    }

    async function loadProject() {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setDebugInfo('starting load...');
      
      try {
        const loaded = await getOrCreateCurrentProject();
        setDebugInfo(`loaded: ${loaded?.id?.slice(0,8)}`);
        setProject(loaded);
        hasLoadedRef.current = true;
      } catch (err) {
        setDebugInfo(`error: ${err instanceof Error ? err.message : 'unknown'}`);
        console.error('Failed to load project:', err);
        setProject(null);
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    }
    
    loadProject();
  }, [status, session?.user?.id]);

  // Debounced save - only save the fields that can be updated
  useEffect(() => {
    if (!project) return;

    const timer = setTimeout(async () => {
      // Extract only the fields that should be saved (exclude id, createdAt, updatedAt)
      const { id, createdAt, updatedAt, ...savableFields } = project;
      
      try {
        await saveProjectAction(id, savableFields);
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
      
      // Extract only the fields that should be saved (exclude id, createdAt, updatedAt)
      const { id, createdAt, updatedAt, ...savableFields } = updatedProject;
      
      // Save immediately without debounce (fire and forget from state update)
      saveProjectAction(id, savableFields).catch((err) => {
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
    loading: showLoading, // Only show loading for initial fetch, NOT for background saves
    updateProject,
    updateProjectAndSave,
    resetProject,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        background: 'rgba(0,0,0,0.9)',
        color: '#0f0',
        padding: 10,
        borderRadius: 8,
        fontSize: 11,
        fontFamily: 'monospace',
        zIndex: 99999,
      }}>
        status={status} | loading={String(loading)} | showLoading={String(showLoading)} | project={project ? 'yes' : 'no'} | {debugInfo}
      </div>
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
