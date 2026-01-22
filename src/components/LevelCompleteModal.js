import React, { useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
} from 'react-native';

const { width } = Dimensions.get('window');

const LevelCompleteModal = ({ visible, level, onNextLevel, onRestart }) => {
    const scale = useRef(new Animated.Value(0)).current;
    const rotation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            scale.setValue(0);
            rotation.setValue(-5);

            Animated.sequence([
                Animated.spring(scale, {
                    toValue: 1.2,
                    friction: 4,
                    useNativeDriver: true,
                }),
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 5,
                    useNativeDriver: true,
                }),
            ]).start();

            Animated.spring(rotation, {
                toValue: 0,
                friction: 5,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.modalContent,
                        {
                            transform: [
                                { scale },
                                {
                                    rotate: rotation.interpolate({
                                        inputRange: [-5, 0],
                                        outputRange: ['-5deg', '0deg'],
                                    })
                                },
                            ],
                        },
                    ]}
                >
                    {/* Star decorations */}
                    <View style={styles.starsContainer}>
                        <Text style={styles.star}>⭐</Text>
                        <Text style={[styles.star, styles.starLarge]}>⭐</Text>
                        <Text style={styles.star}>⭐</Text>
                    </View>

                    <Text style={styles.title}>Level Complete! 🎉</Text>
                    <Text style={styles.subtitle}>You freed all the birds!</Text>
                    <Text style={styles.levelText}>Level {level}</Text>

                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.restartButton]}
                            onPress={onRestart}
                        >
                            <Text style={styles.buttonText}>Restart</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.nextButton]}
                            onPress={onNextLevel}
                        >
                            <Text style={styles.buttonText}>Next Level →</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        width: width * 0.85,
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 8,
    },
    star: {
        fontSize: 30,
    },
    starLarge: {
        fontSize: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: '#7F8C8D',
        marginBottom: 16,
        textAlign: 'center',
    },
    levelText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#3498DB',
        marginBottom: 32,
    },
    buttonsContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    restartButton: {
        backgroundColor: '#95A5A6',
    },
    nextButton: {
        backgroundColor: '#2ECC71',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default LevelCompleteModal;
