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
  const [showLoading, setShowLoading] = useState(false); // Delayed loading indicator
  const [isPending, startTransition] = useTransition();
  
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

  // DEBUG: Visual debug log
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const addLog = (msg: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
    setDebugLogs(prev => [...prev.slice(-15), `${timestamp} ${msg}`]);
  };
  
  const renderCountRef = useRef(0);
  renderCountRef.current++;

  // Load project on mount and when user changes
  useEffect(() => {
    const userId = session?.user?.id;
    
    addLog(`Effect: status=${status}, userId=${userId?.slice(0,8) || 'none'}, hasLoaded=${hasLoadedRef.current}, isLoading=${isLoadingRef.current}`);
    
    // Wait for session to resolve before doing anything
    if (status === 'loading') {
      addLog('Session loading, waiting...');
      return;
    }
    
    // Reset state if logged out
    if (status === 'unauthenticated') {
      addLog('Unauthenticated, clearing');
      setProject(null);
      setLoading(false);
      hasLoadedRef.current = false;
      lastUserIdRef.current = null;
      return;
    }
    
    // From here, status is 'authenticated'
    
    // Reset if user changed to a DIFFERENT user
    if (userId && lastUserIdRef.current && userId !== lastUserIdRef.current) {
      addLog('User changed, resetting');
      hasLoadedRef.current = false;
      setProject(null);
    }
    if (userId) {
      lastUserIdRef.current = userId;
    }
    
    // Currently loading, let it finish
    if (isLoadingRef.current) {
      addLog('Already loading, skip');
      return;
    }
    
    // Already loaded
    if (hasLoadedRef.current) {
      addLog('Already loaded, skip');
      if (loading) setLoading(false);
      return;
    }

    async function loadProject() {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      addLog('Starting load...');
      
      try {
        const loaded = await getOrCreateCurrentProject();
        addLog(`Loaded: ${loaded?.id?.slice(0,8) || 'null'}`);
        setProject(loaded);
        hasLoadedRef.current = true;
      } catch (err) {
        addLog(`Error: ${err instanceof Error ? err.message : 'unknown'}`);
        setProject(null);
      } finally {
        addLog('Load done, loading=false');
        setLoading(false);
        isLoadingRef.current = false;
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
    loading: showLoading || isPending, // Use delayed loading to avoid flash
    updateProject,
    updateProjectAndSave,
    resetProject,
  };

  // DEBUG: Show debug panel
  const showDebug = true; // Set to false to hide

  return (
    <ProjectContext.Provider value={value}>
      {children}
      {showDebug && (
        <div style={{
          position: 'fixed',
          bottom: 10,
          right: 10,
          background: 'rgba(0,0,0,0.9)',
          color: '#0f0',
          padding: 10,
          borderRadius: 8,
          fontSize: 10,
          fontFamily: 'monospace',
          maxWidth: 350,
          maxHeight: 250,
          overflow: 'auto',
          zIndex: 99999,
        }}>
          <div style={{ marginBottom: 5, color: '#fff', fontWeight: 'bold' }}>
            Debug: render#{renderCountRef.current} | loading={String(loading)} | showLoading={String(showLoading)} | project={project ? 'yes' : 'no'} | status={status}
          </div>
          {debugLogs.map((log, i) => (
            <div key={i} style={{ opacity: 0.8 }}>{log}</div>
          ))}
        </div>
      )}
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
