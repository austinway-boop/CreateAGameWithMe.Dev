'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Project as ProjectType } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Mock user ID for development
const MOCK_USER_ID = 'dev-user-123';
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

// Get authenticated user ID (or mock user in development)
async function getAuthenticatedUserId(): Promise<string | null> {
  if (USE_MOCK_AUTH) {
    return MOCK_USER_ID;
  }
  
  const session = await auth();
  return session?.user?.id || null;
}

// Ensure mock user exists in database (for development)
async function ensureMockUserExists(): Promise<void> {
  if (!USE_MOCK_AUTH) return;
  
  const existingUser = await prisma.user.findUnique({
    where: { id: MOCK_USER_ID },
  });
  
  if (!existingUser) {
    await prisma.user.create({
      data: {
        id: MOCK_USER_ID,
        email: 'dev@example.com',
        name: 'Dev User',
        username: 'devuser',
        onboardingComplete: true,
      },
    });
  }
}

// Convert Prisma Project to App Project type
function toAppProject(dbProject: {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  hasIdea: boolean | null;
  platform: string;
  teamSize: string;
  timeHorizon: string;
  ideaDescription: string;
  vibeChips: string[];
  structuredIdea: unknown;
  ikigai: unknown;
  sparkRounds: unknown;
  selectedSpark: unknown;
  additionalContext: string;
  regenerationAttempts: unknown;
  finalTitle: string;
  finalConcept: string;
  gameLoop: unknown;
  gameQuestions: unknown;
  skillTree: unknown;
  conceptImage: string;
  hasConceptCard: boolean;
  conceptCardCreatedAt: string;
  currentPage: string;
}): ProjectType {
  return {
    id: dbProject.id,
    createdAt: dbProject.createdAt.toISOString(),
    updatedAt: dbProject.updatedAt.toISOString(),
    hasIdea: dbProject.hasIdea,
    platform: dbProject.platform,
    teamSize: dbProject.teamSize,
    timeHorizon: dbProject.timeHorizon,
    ideaDescription: dbProject.ideaDescription,
    vibeChips: dbProject.vibeChips,
    structuredIdea: dbProject.structuredIdea as ProjectType['structuredIdea'],
    ikigai: dbProject.ikigai as ProjectType['ikigai'],
    sparkRounds: dbProject.sparkRounds as ProjectType['sparkRounds'],
    selectedSpark: dbProject.selectedSpark as ProjectType['selectedSpark'],
    additionalContext: dbProject.additionalContext,
    regenerationAttempts: dbProject.regenerationAttempts as ProjectType['regenerationAttempts'],
    finalTitle: dbProject.finalTitle,
    finalConcept: dbProject.finalConcept,
    gameLoop: dbProject.gameLoop as ProjectType['gameLoop'],
    gameQuestions: (dbProject.gameQuestions as ProjectType['gameQuestions']) ?? null,
    skillTree: (dbProject.skillTree as ProjectType['skillTree']) ?? [],
    conceptImage: dbProject.conceptImage,
    hasConceptCard: dbProject.hasConceptCard,
    conceptCardCreatedAt: dbProject.conceptCardCreatedAt,
    currentPage: dbProject.currentPage,
  };
}

export async function getProjects(): Promise<ProjectType[]> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return [];
  }

  if (USE_MOCK_AUTH) {
    await ensureMockUserExists();
  }

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });

  return projects.map(toAppProject);
}

export async function getProject(id: string): Promise<ProjectType | null> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return null;
  }

  if (USE_MOCK_AUTH) {
    await ensureMockUserExists();
  }

  const project = await prisma.project.findFirst({
    where: { 
      id,
      userId,
    },
  });

  return project ? toAppProject(project) : null;
}

export async function createProject(): Promise<ProjectType> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('Not authenticated');
  }

  if (USE_MOCK_AUTH) {
    await ensureMockUserExists();
  }

  const project = await prisma.project.create({
    data: {
      userId,
      ikigai: { chips: [] },
      sparkRounds: [],
      regenerationAttempts: [],
      gameLoop: [],
    },
  });

  revalidatePath('/create');
  return toAppProject(project);
}

export async function saveProject(id: string, updates: Partial<ProjectType>): Promise<ProjectType> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('Not authenticated');
  }

  // Verify ownership
  const existing = await prisma.project.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error('Project not found');
  }

  // Convert app types to DB types
  const dbUpdates: Record<string, unknown> = {};
  
  if (updates.hasIdea !== undefined) dbUpdates.hasIdea = updates.hasIdea;
  if (updates.platform !== undefined) dbUpdates.platform = updates.platform;
  if (updates.teamSize !== undefined) dbUpdates.teamSize = updates.teamSize;
  if (updates.timeHorizon !== undefined) dbUpdates.timeHorizon = updates.timeHorizon;
  if (updates.ideaDescription !== undefined) dbUpdates.ideaDescription = updates.ideaDescription;
  if (updates.vibeChips !== undefined) dbUpdates.vibeChips = updates.vibeChips;
  if (updates.structuredIdea !== undefined) dbUpdates.structuredIdea = updates.structuredIdea;
  if (updates.ikigai !== undefined) dbUpdates.ikigai = updates.ikigai;
  if (updates.sparkRounds !== undefined) dbUpdates.sparkRounds = updates.sparkRounds;
  if (updates.selectedSpark !== undefined) dbUpdates.selectedSpark = updates.selectedSpark;
  if (updates.additionalContext !== undefined) dbUpdates.additionalContext = updates.additionalContext;
  if (updates.regenerationAttempts !== undefined) dbUpdates.regenerationAttempts = updates.regenerationAttempts;
  if (updates.finalTitle !== undefined) dbUpdates.finalTitle = updates.finalTitle;
  if (updates.finalConcept !== undefined) dbUpdates.finalConcept = updates.finalConcept;
  if (updates.gameLoop !== undefined) dbUpdates.gameLoop = updates.gameLoop;
  if (updates.gameQuestions !== undefined) dbUpdates.gameQuestions = updates.gameQuestions;
  if (updates.skillTree !== undefined) dbUpdates.skillTree = updates.skillTree;
  if (updates.conceptImage !== undefined) dbUpdates.conceptImage = updates.conceptImage;
  if (updates.hasConceptCard !== undefined) dbUpdates.hasConceptCard = updates.hasConceptCard;
  if (updates.conceptCardCreatedAt !== undefined) dbUpdates.conceptCardCreatedAt = updates.conceptCardCreatedAt;
  if (updates.currentPage !== undefined) dbUpdates.currentPage = updates.currentPage;

  const project = await prisma.project.update({
    where: { id },
    data: dbUpdates,
  });

  return toAppProject(project);
}

export async function deleteProject(id: string): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('Not authenticated');
  }

  await prisma.project.deleteMany({
    where: { 
      id,
      userId,
    },
  });

  revalidatePath('/create');
}

export async function getOrCreateCurrentProject(): Promise<ProjectType> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('Not authenticated');
  }

  if (USE_MOCK_AUTH) {
    await ensureMockUserExists();
  }

  // Get most recent project or create one
  const existingProject = await prisma.project.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });

  if (existingProject) {
    return toAppProject(existingProject);
  }

  // Create new project
  const project = await prisma.project.create({
    data: {
      userId,
      ikigai: { chips: [] },
      sparkRounds: [],
      regenerationAttempts: [],
      gameLoop: [],
    },
  });

  return toAppProject(project);
}
