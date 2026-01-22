import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const DIAMONDS_KEY = '@diamonds';

class EconomyService {
    constructor() {
        this.diamonds = 0;
        this.listeners = [];
    }

    // Initialize and load diamonds
    async init() {
        try {
            const diamonds = await this.getDiamonds();
            this.diamonds = diamonds;
            return diamonds;
        } catch (error) {
            console.error('[EconomyService] Init error:', error);
            return 0;
        }
    }

    // Get current diamond balance
    async getDiamonds() {
        try {
            const user = auth().currentUser;

            if (user && !user.isAnonymous) {
                // Fetch from Firestore for logged-in users
                const doc = await firestore()
                    .collection('users')
                    .doc(user.uid)
                    .get();

                let diamonds = doc.data()?.diamonds;

                // Initialize new users with 5 diamonds
                if (diamonds === undefined || diamonds === null) {
                    diamonds = 5;
                    console.log('[EconomyService] New user! Granting 5 starting diamonds');

                    // Save to Firestore
                    await firestore()
                        .collection('users')
                        .doc(user.uid)
                        .set({ diamonds: 5 }, { merge: true });
                }

                // Cache locally
                await AsyncStorage.setItem(DIAMONDS_KEY, diamonds.toString());
                return diamonds;
            } else {
                // Use AsyncStorage for guest/offline
                const stored = await AsyncStorage.getItem(DIAMONDS_KEY);

                if (stored === null) {
                    // New guest user - give 5 diamonds
                    await AsyncStorage.setItem(DIAMONDS_KEY, '5');
                    return 5;
                }

                return parseInt(stored, 10);
            }
        } catch (error) {
            console.error('[EconomyService] Get diamonds error:', error);
            // Fallback to AsyncStorage
            const stored = await AsyncStorage.getItem(DIAMONDS_KEY);

            if (stored === null) {
                await AsyncStorage.setItem(DIAMONDS_KEY, '5');
                return 5;
            }

            return stored ? parseInt(stored, 10) : 5;
        }
    }

    // Add diamonds (rewards)
    async addDiamonds(amount) {
        try {
            const currentDiamonds = await this.getDiamonds();
            const newDiamonds = currentDiamonds + amount;

            const user = auth().currentUser;

            if (user && !user.isAnonymous) {
                // Update Firestore
                await firestore()
                    .collection('users')
                    .doc(user.uid)
                    .set({ diamonds: newDiamonds }, { merge: true });
            }

            // Update AsyncStorage
            await AsyncStorage.setItem(DIAMONDS_KEY, newDiamonds.toString());

            this.diamonds = newDiamonds;
            this.notifyListeners();

            return newDiamonds;
        } catch (error) {
            console.error('[EconomyService] Add diamonds error:', error);
            throw error;
        }
    }

    // Spend diamonds (purchases)
    async spendDiamonds(amount) {
        try {
            const currentDiamonds = await this.getDiamonds();

            if (currentDiamonds < amount) {
                throw new Error('Insufficient diamonds');
            }

            const newDiamonds = currentDiamonds - amount;

            const user = auth().currentUser;

            if (user && !user.isAnonymous) {
                // Update Firestore
                await firestore()
                    .collection('users')
                    .doc(user.uid)
                    .set({ diamonds: newDiamonds }, { merge: true });
            }

            // Update AsyncStorage
            await AsyncStorage.setItem(DIAMONDS_KEY, newDiamonds.toString());

            this.diamonds = newDiamonds;
            this.notifyListeners();

            return newDiamonds;
        } catch (error) {
            console.error('[EconomyService] Spend diamonds error:', error);
            throw error;
        }
    }

    // Subscribe to diamond changes
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback(this.diamonds));
    }
}

export default new EconomyService();
