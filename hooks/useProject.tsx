'use client';

import { useState, useEffect, useCallback, createContext, useContext, useRef, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { Project } from '@/lib/types';
import { 
  getOrCreateCurrentProject, 
  saveProject as saveProjectAction,
  createProject as createProjectAction,
} from '@/lib/actions/project';

interface UseProjectReturn {
  project: Project | null;
  loading: boolean;
  isInitialLoad: boolean;
  updateProject: (updates: Partial<Project>) => void;
  updateProjectAndSave: (updates: Partial<Project>) => Promise<void>;
  resetProject: () => Promise<void>;
  retryLoad: () => Promise<void>;
}

// Context for sharing project state across all pages
const ProjectContext = createContext<UseProjectReturn | null>(null);

// In-memory cache for instant loads on navigation
let projectCache: Project | null = null;
let cacheUserId: string | null = null;

// Check if mock auth is enabled
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
const MOCK_USER_ID = 'dev-user-123';

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  // Use the unified auth hook that handles both mock and real auth
  const { data: session, status } = useAuth();
  
  const [project, setProject] = useState<Project | null>(() => {
    const userId = USE_MOCK_AUTH ? MOCK_USER_ID : session?.user?.id;
    if (projectCache && cacheUserId === userId) {
      return projectCache;
    }
    return null;
  });
  const [loading, setLoading] = useState(!projectCache);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Track loading state
  const hasLoadedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<Partial<Project> | null>(null);

  // Load project on mount and when user changes
  useEffect(() => {
    // For mock auth, always use mock user ID
    const userId = USE_MOCK_AUTH ? MOCK_USER_ID : session?.user?.id;
    
    // For real auth, wait for session to resolve
    if (!USE_MOCK_AUTH && status === 'loading') {
      return;
    }
    
    // Reset state if logged out (only for real auth)
    if (!USE_MOCK_AUTH && status === 'unauthenticated') {
      setProject(null);
      projectCache = null;
      cacheUserId = null;
      setLoading(false);
      setIsInitialLoad(false);
      hasLoadedRef.current = false;
      lastUserIdRef.current = null;
      return;
    }
    
    // Reset if user changed
    if (userId && lastUserIdRef.current && userId !== lastUserIdRef.current) {
      hasLoadedRef.current = false;
      projectCache = null;
      cacheUserId = null;
      setProject(null);
    }
    if (userId) {
      lastUserIdRef.current = userId;
    }
    
    // Skip if already loading or loaded
    if (isLoadingRef.current || hasLoadedRef.current) {
      if (hasLoadedRef.current && loading) {
        setLoading(false);
        setIsInitialLoad(false);
      }
      return;
    }

    // Check cache first - instant load!
    if (projectCache && cacheUserId === userId) {
      setProject(projectCache);
      setLoading(false);
      setIsInitialLoad(false);
      hasLoadedRef.current = true;
      return;
    }

    // For mock auth or authenticated users, load the project
    if (USE_MOCK_AUTH || userId) {
      loadProject();
    }

    async function loadProject() {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      
      try {
        const loaded = await getOrCreateCurrentProject();
        setProject(loaded);
        // Update cache
        projectCache = loaded;
        cacheUserId = userId || null;
        hasLoadedRef.current = true;
      } catch (err) {
        console.error('Failed to load project:', err);
        setProject(null);
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
        isLoadingRef.current = false;
      }
    }
  }, [status, session?.user?.id, loading]);

  // Optimized debounced save with batching
  const flushSave = useCallback(async () => {
    if (!project || !pendingSaveRef.current) return;
    
    const { id, createdAt, updatedAt, ...savableFields } = project;
    pendingSaveRef.current = null;
    
    try {
      await saveProjectAction(id, savableFields);
    } catch (err) {
      console.error('Failed to save project:', err);
    }
  }, [project]);

  // Schedule save with debouncing
  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(flushSave, 800);
  }, [flushSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Flush any pending saves
        if (pendingSaveRef.current && project) {
          const { id, createdAt, updatedAt, ...savableFields } = project;
          saveProjectAction(id, savableFields).catch(console.error);
        }
      }
    };
  }, [project]);

  const updateProject = useCallback((updates: Partial<Project>) => {
    setProject((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      // Update cache immediately
      projectCache = updated;
      pendingSaveRef.current = updates;
      return updated;
    });
    scheduleSave();
  }, [scheduleSave]);

  // Immediate save - use when navigating away
  const updateProjectAndSave = useCallback(async (updates: Partial<Project>) => {
    // Clear any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    setProject((prev) => {
      if (!prev) return prev;
      const updatedProject = { ...prev, ...updates };
      
      // Update cache immediately
      projectCache = updatedProject;
      
      // Extract only the fields that should be saved
      const { id, createdAt, updatedAt, ...savableFields } = updatedProject;
      
      // Save immediately
      saveProjectAction(id, savableFields).catch((err) => {
        console.error('Failed to save project:', err);
      });
      
      return updatedProject;
    });
  }, []);

  const resetProject = useCallback(async () => {
    setLoading(true);
    try {
      const fresh = await createProjectAction();
      setProject(fresh);
      projectCache = fresh;
      cacheUserId = USE_MOCK_AUTH ? MOCK_USER_ID : session?.user?.id || null;
    } catch (err) {
      console.error('Failed to reset project:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const retryLoad = useCallback(async () => {
    hasLoadedRef.current = false;
    isLoadingRef.current = false;
    projectCache = null;
    setLoading(true);
    
    try {
      const loaded = await getOrCreateCurrentProject();
      setProject(loaded);
      projectCache = loaded;
      cacheUserId = USE_MOCK_AUTH ? MOCK_USER_ID : session?.user?.id || null;
      hasLoadedRef.current = true;
    } catch (err) {
      console.error('Failed to load project:', err);
      setProject(null);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [session?.user?.id]);

  const value: UseProjectReturn = {
    project,
    loading,
    isInitialLoad,
    updateProject,
    updateProjectAndSave,
    resetProject,
    retryLoad,
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
