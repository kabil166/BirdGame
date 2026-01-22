module.exports = {
    expo: {
        name: "BirdGame",
        slug: "BirdGame",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        newArchEnabled: true,
        plugins: [
            "@react-native-google-signin/google-signin"
        ],
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        ios: {
            supportsTablet: true
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            package: "com.birdgame.app",
            edgeToEdgeEnabled: true,
            googleServicesFile: "./google-services.json"
        },
        scheme: "birdgame",
        web: {
            favicon: "./assets/favicon.png"
        },
        extra: {
            eas: {
                projectId: "6c7f49ca-c77c-4d35-99ef-39f6a16093d3"
            },
            // Firebase configuration
            firebaseApiKey: process.env.FIREBASE_API_KEY,
            firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
            firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
            firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            firebaseAppId: process.env.FIREBASE_APP_ID,
            firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
            // Google Sign-In
            googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
        }
    }
};
