import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCAL_PROGRESS_KEY = '@BirdGame:LocalProgress';

const gameService = {
    // Get user's game progress from Firestore
    async getProgress() {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('User not authenticated');

            const doc = await firestore()
                .collection('gameProgress')
                .doc(user.uid)
                .get();

            if (doc.exists) {
                return doc.data();
            }

            // Return default progress if no data exists
            return {
                currentLevel: 1,
                highestLevelUnlocked: 1,
                levelStars: {},
                totalStars: 0,
                gamesPlayed: 0,
            };
        } catch (error) {
            console.error('Failed to fetch progress from Firestore:', error);
            throw error;
        }
    },

    // Save game progress to Firestore
    async saveProgress(progressData) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('User not authenticated');

            await firestore()
                .collection('gameProgress')
                .doc(user.uid)
                .set({
                    ...progressData,
                    lastUpdated: firestore.FieldValue.serverTimestamp(),
                }, { merge: true });

            return progressData;
        } catch (error) {
            console.error('Failed to save progress to Firestore:', error);
            // Save locally as fallback
            await this.saveProgressLocally(progressData);
            throw error;
        }
    },

    // Update level completion (simplified)
    async updateLevelCompletion(levelId, stars) {
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('User not authenticated');

            const docRef = firestore().collection('gameProgress').doc(user.uid);

            // Get current progress
            const doc = await docRef.get();
            const currentProgress = doc.exists ? doc.data() : {
                currentLevel: 1,
                highestLevelUnlocked: 1,
                levelStars: {},
                totalStars: 0,
                gamesPlayed: 0,
            };

            // Update level stars (keep highest)
            const newLevelStars = { ...currentProgress.levelStars };
            newLevelStars[levelId.toString()] = Math.max(
                newLevelStars[levelId.toString()] || 0,
                stars
            );

            // Calculate total stars
            const totalStars = Object.values(newLevelStars).reduce((sum, s) => sum + s, 0);

            // Update highest unlocked
            const highestLevelUnlocked = Math.max(
                currentProgress.highestLevelUnlocked,
                stars > 0 ? levelId + 1 : levelId
            );

            // Save to Firestore
            await docRef.set({
                currentLevel: levelId,
                highestLevelUnlocked,
                levelStars: newLevelStars,
                totalStars,
                gamesPlayed: currentProgress.gamesPlayed + 1,
                lastUpdated: firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            return {
                currentLevel: levelId,
                highestLevelUnlocked,
                levelStars: newLevelStars,
                totalStars,
                gamesPlayed: currentProgress.gamesPlayed + 1,
            };
        } catch (error) {
            console.error('Failed to update level:', error);
            throw error;
        }
    },

    // Get leaderboard
    async getLeaderboard(limit = 100) {
        try {
            const snapshot = await firestore()
                .collection('gameProgress')
                .orderBy('totalStars', 'desc')
                .orderBy('highestLevelUnlocked', 'desc')
                .limit(limit)
                .get();

            const leaderboard = [];
            for (const doc of snapshot.docs) {
                const progress = doc.data();

                // Get user info
                const userDoc = await firestore()
                    .collection('users')
                    .doc(doc.id)
                    .get();

                const userData = userDoc.exists ? userDoc.data() : {};

                leaderboard.push({
                    rank: leaderboard.length + 1,
                    displayName: userData.displayName || 'Anonymous',
                    profilePicture: userData.photoURL,
                    totalStars: progress.totalStars || 0,
                    highestLevelUnlocked: progress.highestLevelUnlocked || 1,
                    gamesPlayed: progress.gamesPlayed || 0,
                });
            }

            return leaderboard;
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            throw error;
        }
    },

    // Migrate local progress to Firestore
    async migrateLocalProgress() {
        try {
            const localProgress = await this.getLocalProgress();

            if (!localProgress || !localProgress.highestCompletedLevel) {
                console.log('No local progress to migrate');
                return null;
            }

            const user = auth().currentUser;
            if (!user) throw new Error('User not authenticated');

            // Get current Firestore progress
            const doc = await firestore()
                .collection('gameProgress')
                .doc(user.uid)
                .get();

            const firestoreProgress = doc.exists ? doc.data() : null;

            // Merge local with Firestore (keep highest values)
            const mergedProgress = {
                currentLevel: Math.max(
                    localProgress.currentLevel || 1,
                    firestoreProgress?.currentLevel || 1
                ),
                highestLevelUnlocked: Math.max(
                    (localProgress.highestCompletedLevel || 0) + 1,
                    firestoreProgress?.highestLevelUnlocked || 1
                ),
                levelStars: {
                    ...(firestoreProgress?.levelStars || {}),
                    ...(localProgress.levelStars || {}),
                },
                gamesPlayed: (localProgress.gamesPlayed || 0) + (firestoreProgress?.gamesPlayed || 0),
            };

            // Calculate total stars
            mergedProgress.totalStars = Object.values(mergedProgress.levelStars).reduce(
                (sum, stars) => sum + stars,
                0
            );

            // Save merged progress
            await this.saveProgress(mergedProgress);

            // Clear local progress after successful migration
            await AsyncStorage.removeItem(LOCAL_PROGRESS_KEY);

            console.log('Progress migrated successfully');
            return mergedProgress;
        } catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    },

    // Local storage helpers (for offline support)
    async getLocalProgress() {
        try {
            const data = await AsyncStorage.getItem(LOCAL_PROGRESS_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to get local progress:', error);
            return null;
        }
    },

    async saveProgressLocally(progressData) {
        try {
            await AsyncStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progressData));
        } catch (error) {
            console.error('Failed to save local progress:', error);
        }
    },

    // Load progress with offline fallback
    async loadProgress() {
        try {
            // Try to get from Firestore first
            const firestoreProgress = await this.getProgress();
            // Cache it locally
            await this.saveProgressLocally(firestoreProgress);
            return firestoreProgress;
        } catch (error) {
            // If Firestore fails, use local cache
            console.log('Loading from local cache...');
            return await this.getLocalProgress();
        }
    },
};

export default gameService;
