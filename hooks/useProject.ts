'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/lib/types';
import { getOrCreateCurrentProject, saveProject, setCurrentProjectId } from '@/lib/db';

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
        await saveProject(project);
      } catch (err) {
        console.error('Failed to save project:', err);
      }
    }, 300);

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
    let updatedProject: Project | null = null;
    setProject((prev) => {
      if (!prev) return prev;
      updatedProject = { ...prev, ...updates };
      return updatedProject;
    });
    
    // Save immediately without debounce
    if (updatedProject) {
      try {
        await saveProject(updatedProject);
      } catch (err) {
        console.error('Failed to save project:', err);
      }
    }
  }, []);

  const resetProject = useCallback(async () => {
    setLoading(true);
    try {
      const newProject = await getOrCreateCurrentProject();
      // Clear and create new
      const fresh = {
        ...newProject,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasIdea: null,
        platform: '',
        teamSize: '',
        timeHorizon: '',
        ideaDescription: '',
        vibeChips: [],
        structuredIdea: null,
        ikigai: { chips: [] },
        sparkRounds: [],
        selectedSpark: null,
        finalTitle: '',
        finalConcept: '',
      };
      setCurrentProjectId(fresh.id);
      await saveProject(fresh);
      setProject(fresh);
    } catch (err) {
      console.error('Failed to reset project:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    project,
    loading,
    updateProject,
    updateProjectAndSave,
    resetProject,
  };
}
