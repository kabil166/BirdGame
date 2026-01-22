import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import config from '../config/env';

// Configure Google Sign-In
GoogleSignin.configure({
    webClientId: config.google.webClientId,
});

const authService = {
    // Initialize auth state listener
    onAuthStateChanged(callback) {
        return auth().onAuthStateChanged(callback);
    },

    // Get current user
    getCurrentUser() {
        return auth().currentUser;
    },

    // Google Sign-In
    async loginWithGoogle() {
        try {
            console.log('Step 1: Checking Play Services...');
            // Check if device supports Google Play
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            console.log('Step 1: Play Services OK');

            console.log('Step 2: Starting Google Sign-In...');
            // Get user's ID token
            const signInResult = await GoogleSignin.signIn();
            console.log('Step 2: Sign-In successful');

            // Extract idToken from the nested data structure
            const idToken = signInResult?.data?.idToken || signInResult?.idToken;

            if (!idToken) {
                console.error('Sign-In result structure:', JSON.stringify(signInResult));
                throw new Error('No ID token received from Google Sign-In');
            }
            console.log('Step 3: Got ID token');

            console.log('Step 4: Creating Firebase credential...');
            // Create a Google credential with the token
            const googleCredential = auth.GoogleAuthProvider.credential(idToken);
            console.log('Step 4: Credential created');

            console.log('Step 5: Signing in to Firebase...');
            // Sign-in the user with the credential
            const userCredential = await auth().signInWithCredential(googleCredential);
            console.log('Step 5: Firebase sign-in successful!');

            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            return {
                success: false,
                error: String(error?.message || error || 'Unknown error occurred')
            };
        }
    },

    // Anonymous Sign-In (for guest users)
    async loginAsGuest() {
        try {
            const userCredential = await auth().signInAnonymously();
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.warn('Guest Sign-In Error (Firebase):', error.message);
            // Fallback for Web/Partial Setup: Allow guest access without Firebase
            return {
                success: true,
                user: {
                    uid: 'guest_' + Math.random().toString(36).substr(2, 9),
                    isAnonymous: true,
                    displayName: 'Guest Player'
                }
            };
        }
    },

    // Email/Password Sign-In (for username login)
    async loginWithEmail(email, password) {
        try {
            const userCredential = await auth().signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            // If user doesn't exist, create account
            if (error.code === 'auth/user-not-found') {
                return await this.createAccountWithEmail(email, password);
            }
            console.error('Email Sign-In Error:', error);
            return { success: false, error: error.message };
        }
    },

    // Create account with email/password
    async createAccountWithEmail(email, password) {
        try {
            const userCredential = await auth().createUserWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Account Creation Error:', error);
            return { success: false, error: error.message };
        }
    },

    // Username-based login (converts to email)
    async loginWithUsername(username) {
        try {
            // Convert username to email format for Firebase
            const email = `${username.toLowerCase()}@birdgame.local`;
            const password = `birdgame_${username.toLowerCase()}_2024`; // Simple password generation

            return await this.loginWithEmail(email, password);
        } catch (error) {
            console.error('Username Login Error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update user profile
    async updateProfile(displayName, photoURL) {
        try {
            const user = auth().currentUser;
            await user.updateProfile({
                displayName: displayName || user.displayName,
                photoURL: photoURL || user.photoURL,
            });
            return { success: true };
        } catch (error) {
            console.error('Update Profile Error:', error);
            return { success: false, error: error.message };
        }
    },

    // Logout
    async logout() {
        try {
            // Sign out from Google (if signed in with Google)
            try {
                await GoogleSignin.signOut();
            } catch (googleError) {
                // User might not be signed in with Google, that's okay
                console.log('Google sign-out skipped:', googleError.message);
            }

            // Sign out from Firebase
            await auth().signOut();

            return { success: true };
        } catch (error) {
            console.error('Logout Error:', error);
            return { success: false, error: error?.message || 'Logout failed' };
        }
    },

    // Check if user is authenticated
    isAuthenticated() {
        return auth().currentUser !== null;
    },
};

export default authService;
