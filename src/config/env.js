import Constants from 'expo-constants';

// Get config from app.json extra field
const extra = Constants.expoConfig?.extra || {};

export const config = {
    firebase: {
        apiKey: extra.firebaseApiKey,
        authDomain: extra.firebaseAuthDomain,
        projectId: extra.firebaseProjectId,
        storageBucket: extra.firebaseStorageBucket,
        messagingSenderId: extra.firebaseMessagingSenderId,
        appId: extra.firebaseAppId,
        measurementId: extra.firebaseMeasurementId,
    },
    google: {
        webClientId: extra.googleWebClientId,
    },
};

export default config;
