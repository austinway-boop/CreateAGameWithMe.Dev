'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Project as ProjectType } from '@/lib/types';
import { revalidatePath } from 'next/cache';

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
    // TODO: Add database columns for these fields, then enable persistence
    gameQuestions: null,
    skillTree: [],
    conceptImage: dbProject.conceptImage,
    hasConceptCard: dbProject.hasConceptCard,
    conceptCardCreatedAt: dbProject.conceptCardCreatedAt,
    currentPage: dbProject.currentPage,
  };
}

export async function getProjects(): Promise<ProjectType[]> {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  });

  return projects.map(toAppProject);
}

export async function getProject(id: string): Promise<ProjectType | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const project = await prisma.project.findFirst({
    where: { 
      id,
      userId: session.user.id,
    },
  });

  return project ? toAppProject(project) : null;
}

export async function createProject(): Promise<ProjectType> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
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
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  // Verify ownership
  const existing = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
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
  // TODO: Uncomment when database columns are added:
  // if (updates.gameQuestions !== undefined) dbUpdates.gameQuestions = updates.gameQuestions;
  // if (updates.skillTree !== undefined) dbUpdates.skillTree = updates.skillTree;
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
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  await prisma.project.deleteMany({
    where: { 
      id,
      userId: session.user.id,
    },
  });

  revalidatePath('/create');
}

export async function getOrCreateCurrentProject(): Promise<ProjectType> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  // Get most recent project or create one
  const existingProject = await prisma.project.findFirst({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
  });

  if (existingProject) {
    return toAppProject(existingProject);
  }

  // Create new project
  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      ikigai: { chips: [] },
      sparkRounds: [],
      regenerationAttempts: [],
      gameLoop: [],
    },
  });

  return toAppProject(project);
}
