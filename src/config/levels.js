// Level generator for Bird Sort Puzzle
// Generates 1000 levels with progressive difficulty

// All available bird breeds
const ALL_BREEDS = ['blue', 'red', 'yellow', 'green', 'purple', 'orange', 'pink', 'cyan'];

// Bird color configurations
export const BIRD_COLORS = {
  blue: { body: '#4A90E2', wing: '#357ABD', name: 'Blue Jay' },
  red: { body: '#E74C3C', wing: '#C0392B', name: 'Cardinal' },
  green: { body: '#2ECC71', wing: '#27AE60', name: 'Parrot' },
  yellow: { body: '#F1C40F', wing: '#F39C12', name: 'Canary' },
  purple: { body: '#9B59B6', wing: '#8E44AD', name: 'Finch' },
  orange: { body: '#E67E22', wing: '#D35400', name: 'Oriole' },
  pink: { body: '#FF69B4', wing: '#FF1493', name: 'Flamingo' },
  cyan: { body: '#00BCD4', wing: '#0097A7', name: 'Kingfisher' },
};

// Game constants
export const GAME_CONFIG = {
  birdSize: 32,
  branchWidth: 55,
  flyDuration: 400,
  matchCelebrationDelay: 500,
};

/**
 * Generate a level configuration based on level number
 * Difficulty increases progressively through 1000 levels
 */
export const generateLevel = (levelId) => {
  // Determine difficulty parameters based on level
  let numBreeds, extraBranches, birdsPerBreed;

  if (levelId <= 10) {
    // Levels 1-10: Very Easy (3 breeds, 2 extra branches)
    numBreeds = 3;
    extraBranches = 2;
    birdsPerBreed = 4;
  } else if (levelId <= 30) {
    // Levels 11-30: Easy (3-4 breeds, 2 extra branches)
    numBreeds = levelId <= 20 ? 3 : 4;
    extraBranches = 2;
    birdsPerBreed = 4;
  } else if (levelId <= 60) {
    // Levels 31-60: Medium Easy (4 breeds, 1-2 extra branches)
    numBreeds = 4;
    extraBranches = levelId <= 45 ? 2 : 1;
    birdsPerBreed = 4;
  } else if (levelId <= 100) {
    // Levels 61-100: Medium (4-5 breeds, 1-2 extra branches)
    numBreeds = levelId <= 80 ? 4 : 5;
    extraBranches = levelId <= 90 ? 2 : 1;
    birdsPerBreed = 4;
  } else if (levelId <= 200) {
    // Levels 101-200: Medium Hard (5 breeds, 1-2 extra branches)
    numBreeds = 5;
    extraBranches = levelId <= 150 ? 2 : 1;
    birdsPerBreed = 4;
  } else if (levelId <= 350) {
    // Levels 201-350: Hard (5-6 breeds, 1-2 extra branches)
    numBreeds = levelId <= 275 ? 5 : 6;
    extraBranches = levelId <= 300 ? 2 : 1;
    birdsPerBreed = 4;
  } else if (levelId <= 500) {
    // Levels 351-500: Very Hard (6 breeds, 1-2 extra branches)
    numBreeds = 6;
    extraBranches = levelId <= 425 ? 2 : 1;
    birdsPerBreed = 4;
  } else if (levelId <= 700) {
    // Levels 501-700: Expert (6-7 breeds, 1-2 extra branches)
    numBreeds = levelId <= 600 ? 6 : 7;
    extraBranches = levelId <= 650 ? 2 : 1;
    birdsPerBreed = 4;
  } else if (levelId <= 850) {
    // Levels 701-850: Master (7 breeds, 1-2 extra branches)
    numBreeds = 7;
    extraBranches = levelId <= 775 ? 2 : 1;
    birdsPerBreed = 4;
  } else {
    // Levels 851-1000: Grandmaster (7-8 breeds, 1 extra branch)
    numBreeds = levelId <= 925 ? 7 : 8;
    extraBranches = 1;
    birdsPerBreed = 4;
  }

  // Select breeds for this level (always start from beginning for consistency)
  const breeds = ALL_BREEDS.slice(0, numBreeds);

  // Calculate total branches needed
  const totalBranches = numBreeds + extraBranches;

  return {
    id: levelId,
    name: `Level ${levelId}`,
    totalBranches,
    maxBirdsPerBranch: birdsPerBreed,
    breeds,
    birdsPerBreed,
    difficulty: getDifficultyLabel(levelId),
  };
};

/**
 * Get difficulty label for display
 */
const getDifficultyLabel = (levelId) => {
  if (levelId <= 10) return 'Tutorial';
  if (levelId <= 30) return 'Easy';
  if (levelId <= 60) return 'Medium Easy';
  if (levelId <= 100) return 'Medium';
  if (levelId <= 200) return 'Medium Hard';
  if (levelId <= 350) return 'Hard';
  if (levelId <= 500) return 'Very Hard';
  if (levelId <= 700) return 'Expert';
  if (levelId <= 850) return 'Master';
  return 'Grandmaster';
};

/**
 * Get level by ID (generates on demand)
 */
export const getLevel = (levelId) => {
  if (levelId < 1 || levelId > 1000) {
    return generateLevel(1); // Default to level 1
  }
  return generateLevel(levelId);
};

/**
 * Get next level ID
 */
export const getNextLevelId = (currentLevelId) => {
  const next = currentLevelId + 1;
  return next <= 1000 ? next : null;
};

/**
 * Get previous level ID
 */
export const getPrevLevelId = (currentLevelId) => {
  const prev = currentLevelId - 1;
  return prev >= 1 ? prev : null;
};

/**
 * Get levels for a specific range (for level selection UI)
 */
export const getLevelsInRange = (startId, endId) => {
  const levels = [];
  const start = Math.max(1, startId);
  const end = Math.min(1000, endId);

  for (let i = start; i <= end; i++) {
    levels.push(generateLevel(i));
  }
  return levels;
};

/**
 * Get all level milestones (every 50 levels) for quick navigation
 */
export const getLevelMilestones = () => {
  const milestones = [1, 10, 25, 50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  return milestones.map(id => generateLevel(id));
};

// Total levels available
export const TOTAL_LEVELS = 1000;

// For backwards compatibility, export first few levels as LEVELS array
export const LEVELS = getLevelsInRange(1, 20);
