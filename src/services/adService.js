import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AD_FREQUENCY_KEY = '@ad_frequency';
const AD_RESTART_COUNT_KEY = '@ad_restart_count';

// Test ad unit IDs - replace with real IDs before production
const AD_UNIT_ID = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';

class AdService {
    constructor() {
        this.interstitial = null;
        this.isAdLoaded = false;
        this.lastAdTime = 0;
        this.restartCount = 0;
        this.levelCompletionCount = 0;
    }

    // Initialize and preload first ad
    async init() {
        try {
            await this.loadAd();
            await this.loadRestartCount();
            console.log('[AdService] Initialized');
        } catch (error) {
            console.error('[AdService] Init error:', error);
        }
    }

    // Load an interstitial ad
    async loadAd() {
        try {
            this.interstitial = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
                requestNonPersonalizedAdsOnly: false,
            });

            const unsubscribe = this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
                this.isAdLoaded = true;
                console.log('[AdService] Ad loaded successfully');
            });

            this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
                this.isAdLoaded = false;
                // Preload next ad
                this.loadAd();
            });

            this.interstitial.load();

            return () => unsubscribe();
        } catch (error) {
            console.error('[AdService] Load ad error:', error);
            this.isAdLoaded = false;
        }
    }

    // Load restart count from storage
    async loadRestartCount() {
        try {
            const stored = await AsyncStorage.getItem(AD_RESTART_COUNT_KEY);
            this.restartCount = stored ? parseInt(stored, 10) : 0;
        } catch (error) {
            console.error('[AdService] Load restart count error:', error);
        }
    }

    // Show ad on level restart (every 2 restarts)
    async showAdOnRestart() {
        try {
            this.restartCount++;
            await AsyncStorage.setItem(AD_RESTART_COUNT_KEY, this.restartCount.toString());

            // Show ad every 2 restarts
            if (this.restartCount % 2 === 0) {
                await this.showAd('restart');
            }
        } catch (error) {
            console.error('[AdService] Show restart ad error:', error);
        }
    }

    // Show ad every 3 levels
    async showAdEvery3Levels(levelId) {
        try {
            if (levelId % 3 === 0) {
                await this.showAd('level_completion');
            }
        } catch (error) {
            console.error('[AdService] Show level ad error:', error);
        }
    }

    // Internal show ad logic

    async showAd(reason = 'unknown') {
        try {
            // Cooldown: Don't show ads more than once per 30 seconds
            const now = Date.now();
            if (now - this.lastAdTime < 30000) {
                console.log('[AdService] Ad on cooldown, skipping');
                return false;
            }

            if (!this.isAdLoaded) {
                console.log('[AdService] Ad not loaded yet, skipping');
                return false;
            }

            console.log(`[AdService] Showing ad (reason: ${reason})`);
            await this.interstitial.show();
            this.lastAdTime = now;
            return true;
        } catch (error) {
            console.error('[AdService] Show ad error:', error);
            return false;
        }
    }

    // Reset restart counter (for testing)
    async resetRestartCount() {
        this.restartCount = 0;
        await AsyncStorage.setItem(AD_RESTART_COUNT_KEY, '0');
    }
}

export default new AdService();
