import gameService from '../services/gameService';

/**
 * Game Progress Manager with Firebase Sync
 * Handles saving and loading player progress with Firestore integration
 */

/**
 * Get the highest completed level
 * Tries Firestore first, falls back to local storage
 * @returns {Promise<number>} Highest completed level (0 if none)
 */
export const getHighestCompletedLevel = async () => {
    console.log(`📖 LOAD: Getting highest completed level...`);
    try {
        // Try to get from Firestore first
        const firestoreProgress = await gameService.loadProgress();
        if (firestoreProgress) {
            const highest = firestoreProgress.highestLevelUnlocked - 1;
            console.log(`✅ LOAD: From Firestore - Highest level: ${highest}`, firestoreProgress);
            return highest; // Firestore stores unlocked, we need completed
        }
    } catch (error) {
        console.log('⚠️ LOAD: Using local progress (Firestore unavailable)', error);
    }

    // Fallback to local storage
    try {
        const localProgress = await gameService.getLocalProgress();
        const highest = localProgress?.highestCompletedLevel || 0;
        console.log(`✅ LOAD: From local storage - Highest level: ${highest}`);
        return highest;
    } catch (error) {
        console.error('❌ LOAD: Error reading progress:', error);
        return 0;
    }
};

/**
 * Save completed level progress
 * Syncs to Firestore and saves locally
 * @param {number} levelId - The level that was completed
 * @param {number} stars - Number of stars earned (1-3)
 */
export const saveCompletedLevel = async (levelId, stars) => {
    console.log(`📝 SAVE: Saving level ${levelId} with ${stars} stars`);
    try {
        const currentHighest = await getHighestCompletedLevel();
        console.log(`📝 SAVE: Current highest completed: ${currentHighest}`);

        if (levelId > currentHighest) {
            console.log(`📝 SAVE: New level! Updating Firestore...`);
            // Update Firestore
            try {
                const result = await gameService.updateLevelCompletion(levelId, stars);
                console.log(`✅ SAVE: Firestore update successful!`, result);
            } catch (error) {
                console.error('❌ SAVE: Firestore save failed, saving locally:', error);
                // Save locally as fallback
                const localProgress = await gameService.getLocalProgress() || {};
                localProgress.highestCompletedLevel = levelId;
                localProgress.levelStars = localProgress.levelStars || {};
                localProgress.levelStars[levelId] = Math.max(localProgress.levelStars[levelId] || 0, stars);
                await gameService.saveProgressLocally(localProgress);
                console.log(`✅ SAVE: Saved locally as fallback`);
            }

            // Award diamonds every 3 levels
            console.log(`💎 CHECK: Level ${levelId} % 3 = ${levelId % 3}`);
            if (levelId % 3 === 0) {
                console.log(`💎 REWARD: Level ${levelId} is divisible by 3! Awarding diamond...`);
                try {
                    const economyService = require('../services/economyService').default;
                    const newDiamonds = await economyService.addDiamonds(1);
                    console.log(`💎 REWARD: Awarded 1 diamond! Total: ${newDiamonds}`);
                    return { levelSaved: true, diamondsAwarded: 1, totalDiamonds: newDiamonds };
                } catch (error) {
                    console.error('❌ REWARD: Diamond award error:', error);
                }
            } else {
                console.log(`💎 SKIP: Level ${levelId} is not divisible by 3, no diamond reward`);
            }
        } else {
            console.log(`⏭️ SAVE: Level ${levelId} already completed (highest: ${currentHighest}), no diamond reward`);
        }

        return { levelSaved: true, diamondsAwarded: 0 };
    } catch (error) {
        console.error('❌ SAVE: Error saving progress:', error);
        return { levelSaved: false, diamondsAwarded: 0 };
    }
};

/**
 * Check if a level is unlocked
 * @param {number} levelId - Level to check
 * @returns {Promise<boolean>} True if level is unlocked
 */
export const isLevelUnlocked = async (levelId) => {
    // Level 1 is always unlocked
    if (levelId === 1) return true;

    const highestCompleted = await getHighestCompletedLevel();
    // Level is unlocked if the previous level was completed
    return levelId <= highestCompleted + 1;
};

/**
 * Get unlocked level count (for quick check)
 * @returns {Promise<number>} Number of unlocked levels
 */
export const getUnlockedLevelCount = async () => {
    const highestCompleted = await getHighestCompletedLevel();
    return highestCompleted + 1; // Next level is also unlocked
};

/**
 * Reset all progress
 * Clears both Firestore and local storage
 */
export const resetProgress = async () => {
    try {
        // Clear local storage
        await gameService.saveProgressLocally({
            highestCompletedLevel: 0,
            levelStars: {},
        });

        // Try to reset on Firestore too
        try {
            await gameService.saveProgress({
                currentLevel: 1,
                highestLevelUnlocked: 1,
                levelStars: {},
                totalStars: 0,
                gamesPlayed: 0,
            });
        } catch (error) {
            console.log('Firestore reset skipped (offline)');
        }
    } catch (error) {
        console.error('Error resetting progress:', error);
    }
};

/**
 * Get detailed progress info
 */
export const getProgressInfo = async () => {
    const highestCompleted = await getHighestCompletedLevel();
    return {
        highestCompletedLevel: highestCompleted,
        nextUnlockedLevel: highestCompleted + 1,
        totalCompleted: highestCompleted,
        percentComplete: Math.round((highestCompleted / 1000) * 100),
    };
};
