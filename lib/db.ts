// This file is deprecated - database operations are now handled via server actions
// See lib/actions/project.ts for the new implementation

export {
  getProjects as getAllProjects,
  getProject,
  createProject,
  saveProject,
  deleteProject,
  getOrCreateCurrentProject,
} from './actions/project';

// Current project management is now handled by the database (most recent project)
// No need for localStorage-based session management

export function getCurrentProjectId(): string | null {
  console.warn('getCurrentProjectId is deprecated - project selection is now server-based');
  return null;
}

export function setCurrentProjectId(_id: string): void {
  console.warn('setCurrentProjectId is deprecated - project selection is now server-based');
}

export function clearCurrentProjectId(): void {
  console.warn('clearCurrentProjectId is deprecated - project selection is now server-based');
}
