'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
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

export function useProject(): UseProjectReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Load project on mount
  useEffect(() => {
    async function loadProject() {
      try {
        const loaded = await getOrCreateCurrentProject();
        setProject(loaded);
      } catch (err) {
        console.error('Failed to load project:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, []);

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
    // Get current project and update it
    const currentProject = project;
    if (!currentProject) return;
    
    const updatedProject = { ...currentProject, ...updates };
    setProject(updatedProject);
    
    // Save immediately without debounce
    try {
      await saveProjectAction(updatedProject.id, updatedProject);
    } catch (err) {
      console.error('Failed to save project:', err);
    }
  }, [project]);

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

  return {
    project,
    loading: loading || isPending,
    updateProject,
    updateProjectAndSave,
    resetProject,
  };
}
