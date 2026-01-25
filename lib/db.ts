import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Project, createEmptyProject } from './types';

// ============================================
// Database Schema
// ============================================

interface ArtifyDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: {
      'by-updated': string;
    };
  };
}

const DB_NAME = 'artify-create-v2';
const DB_VERSION = 1;

// ============================================
// Database Initialization
// ============================================

let dbPromise: Promise<IDBPDatabase<ArtifyDB>> | null = null;

function getDB(): Promise<IDBPDatabase<ArtifyDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ArtifyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('projects')) {
          const store = db.createObjectStore('projects', {
            keyPath: 'id',
          });
          store.createIndex('by-updated', 'updatedAt');
        }
      },
    });
  }
  return dbPromise;
}

// ============================================
// Project CRUD Operations
// ============================================

export async function getAllProjects(): Promise<Project[]> {
  const db = await getDB();
  const projects = await db.getAllFromIndex('projects', 'by-updated');
  return projects.reverse();
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get('projects', id);
}

export async function createProject(): Promise<Project> {
  const db = await getDB();
  const project = createEmptyProject();
  await db.put('projects', project);
  return project;
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDB();
  const updatedProject = {
    ...project,
    updatedAt: new Date().toISOString(),
  };
  await db.put('projects', updatedProject);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('projects', id);
}

// ============================================
// Current Project Management (Session)
// ============================================

const CURRENT_PROJECT_KEY = 'artify-current-project';

export function getCurrentProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_PROJECT_KEY);
}

export function setCurrentProjectId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_PROJECT_KEY, id);
}

export function clearCurrentProjectId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CURRENT_PROJECT_KEY);
}

// ============================================
// Get or Create Current Project
// ============================================

export async function getOrCreateCurrentProject(): Promise<Project> {
  const currentId = getCurrentProjectId();
  
  if (currentId) {
    const project = await getProject(currentId);
    if (project) {
      return project;
    }
  }
  
  // Create new project
  const newProject = await createProject();
  setCurrentProjectId(newProject.id);
  return newProject;
}
