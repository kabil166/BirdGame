import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import authService from '../services/authService';
import gameService from '../services/gameService';
import GoogleSignInButton from '../components/GoogleSignInButton';

const LoginScreen = () => {
    const navigation = useNavigation();
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isUsernameLoading, setIsUsernameLoading] = useState(false);

    useEffect(() => {
        checkAuthentication();
    }, []);

    const checkAuthentication = async () => {
        try {
            // Check if user is already logged in with Firebase
            if (authService.isAuthenticated()) {
                navigation.replace('Home');
                return;
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
        setIsLoading(false);
    };

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        try {
            const result = await authService.loginWithGoogle();

            if (result.success) {
                // Try to migrate local progress
                try {
                    await gameService.migrateLocalProgress();
                } catch (error) {
                    console.log('Migration skipped:', error.message);
                }

                navigation.replace('Home');
            } else {
                Alert.alert('Login Failed', result.error || 'Unable to sign in with Google');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
            console.error('Google login error:', error);
        }
        setIsGoogleLoading(false);
    };

    const handleUsernameLogin = async () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Please enter a username');
            return;
        }

        setIsUsernameLoading(true);
        try {
            const result = await authService.loginWithUsername(username.trim());

            if (result.success) {
                // Set display name if it's a new account
                if (result.user) {
                    await authService.updateProfile(username.trim());
                }

                // Try to migrate local progress
                try {
                    await gameService.migrateLocalProgress();
                } catch (error) {
                    console.log('Migration skipped:', error.message);
                }

                navigation.replace('Home');
            } else {
                Alert.alert('Login Failed', result.error || 'Unable to login');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
            console.error('Username login error:', error);
        }
        setIsUsernameLoading(false);
    };

    const handleGuestLogin = async () => {
        try {
            const result = await authService.loginAsGuest();

            if (result.success) {
                navigation.replace('Home');
            } else {
                Alert.alert('Login Failed', result.error || 'Unable to continue as guest');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
            console.error('Guest login error:', error);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498DB" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>🐦 Bird Game 🐦</Text>
                    <Text style={styles.subtitle}>Sort birds & solve puzzles!</Text>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.welcomeText}>Welcome! Sign in to save your progress</Text>

                    {/* Google Sign In */}
                    <GoogleSignInButton
                        onPress={handleGoogleLogin}
                        loading={isGoogleLoading}
                        disabled={isUsernameLoading}
                    />

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Username Login */}
                    <Text style={styles.label}>Username Login</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Username"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isGoogleLoading}
                    />

                    <TouchableOpacity
                        style={[styles.loginButton, isGoogleLoading && styles.buttonDisabled]}
                        onPress={handleUsernameLogin}
                        disabled={isGoogleLoading || isUsernameLoading}
                    >
                        {isUsernameLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Start Playing</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Guest Login */}
                    <TouchableOpacity
                        style={[styles.guestButton, (isGoogleLoading || isUsernameLoading) && styles.buttonDisabled]}
                        onPress={handleGuestLogin}
                        disabled={isGoogleLoading || isUsernameLoading}
                    >
                        <Text style={styles.guestButtonText}>Play as Guest</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#87CEEB',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#87CEEB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#2C3E50',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 18,
        color: '#34495E',
        fontStyle: 'italic',
    },
    formContainer: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    welcomeText: {
        fontSize: 16,
        color: '#2C3E50',
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '500',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8F9FA',
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 16,
    },
    loginButton: {
        backgroundColor: '#3498DB',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        minHeight: 52,
        justifyContent: 'center',
    },
    loginButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#95A5A6',
        fontWeight: 'bold',
    },
    guestButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#95A5A6',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    guestButtonText: {
        color: '#7F8C8D',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default LoginScreen;
