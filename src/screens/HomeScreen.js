import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TextInput,
    Alert,
    Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getLevelsInRange, getLevelMilestones, BIRD_COLORS, TOTAL_LEVELS } from '../config/levels';
import { getHighestCompletedLevel, getProgressInfo, resetProgress } from '../utils/progressManager';
import authService from '../services/authService';
import economyService from '../services/economyService';

const HomeScreen = () => {
    const navigation = useNavigation();
    const [selectedPage, setSelectedPage] = useState(0);
    const [jumpToLevel, setJumpToLevel] = useState('');
    const [highestCompleted, setHighestCompleted] = useState(0);
    const [progressInfo, setProgressInfo] = useState(null);
    const [userData, setUserData] = useState(null);
    const [diamonds, setDiamonds] = useState(0);

    const LEVELS_PER_PAGE = 20;
    const totalPages = Math.ceil(TOTAL_LEVELS / LEVELS_PER_PAGE);

    const startLevel = selectedPage * LEVELS_PER_PAGE + 1;
    const endLevel = Math.min(startLevel + LEVELS_PER_PAGE - 1, TOTAL_LEVELS);
    const currentLevels = getLevelsInRange(startLevel, endLevel);
    const milestones = getLevelMilestones();

    // Load progress when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadProgress();
        }, [])
    );

    useEffect(() => {
        // Load and subscribe to diamonds
        const loadDiamonds = async () => {
            const count = await economyService.getDiamonds();
            setDiamonds(count);
        };
        loadDiamonds();

        const unsubscribe = economyService.subscribe((newCount) => {
            setDiamonds(newCount);
        });

        return () => unsubscribe();
    }, []);

    const loadProgress = async () => {
        const highest = await getHighestCompletedLevel();
        const info = await getProgressInfo();

        // Get current Firebase user
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            setUserData({
                displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Guest',
                email: currentUser.email,
                profilePicture: currentUser.photoURL,
                isAnonymous: currentUser.isAnonymous,
            });
        }

        setHighestCompleted(highest);
        setProgressInfo(info);
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    onPress: async () => {
                        await authService.logout();
                        navigation.replace('Login');
                    },
                },
            ]
        );
    };

    const isLevelUnlocked = (levelId) => {
        // Level 1 is always unlocked, others need previous completion
        const unlocked = levelId === 1 || levelId <= highestCompleted + 1;
        console.log(`🔓 UNLOCK CHECK: Level ${levelId}, highestCompleted: ${highestCompleted}, unlocked: ${unlocked}`);
        return unlocked;
    };

    const handleStartLevel = (levelId) => {
        if (!isLevelUnlocked(levelId)) {
            Alert.alert(
                '🔒 Level Locked',
                `Complete Level ${levelId - 1} first to unlock this level!`,
                [{ text: 'OK' }]
            );
            return;
        }
        navigation.navigate('Game', { levelId });
    };

    const handleJumpToLevel = () => {
        const level = parseInt(jumpToLevel, 10);
        if (level >= 1 && level <= TOTAL_LEVELS) {
            if (!isLevelUnlocked(level)) {
                Alert.alert(
                    '🔒 Level Locked',
                    `You need to complete Level ${highestCompleted || 0} first.\nYou can only play up to Level ${highestCompleted + 1}.`,
                    [{ text: 'OK' }]
                );
                return;
            }
            handleStartLevel(level);
        } else {
            Alert.alert('Invalid Level', 'Please enter a level between 1 and 1000');
        }
    };

    const handlePageChange = (direction) => {
        const newPage = selectedPage + direction;
        if (newPage >= 0 && newPage < totalPages) {
            setSelectedPage(newPage);
        }
    };

    const handleResetProgress = () => {
        Alert.alert(
            '⚠️ Reset Progress',
            'Are you sure you want to reset all progress? This cannot be undone!',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        await resetProgress();
                        loadProgress();
                    },
                },
            ]
        );
    };

    const getDifficultyColor = (difficulty) => {
        const colors = {
            'Tutorial': '#4CAF50',
            'Easy': '#8BC34A',
            'Medium Easy': '#CDDC39',
            'Medium': '#FFC107',
            'Medium Hard': '#FF9800',
            'Hard': '#FF5722',
            'Very Hard': '#F44336',
            'Expert': '#E91E63',
            'Master': '#9C27B0',
            'Grandmaster': '#673AB7',
        };
        return colors[difficulty] || '#607D8B';
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        {userData?.profilePicture && (
                            <Image
                                source={{ uri: userData.profilePicture }}
                                style={styles.profilePicture}
                            />
                        )}
                        <View style={styles.userTextInfo}>
                            <Text style={styles.welcomeText}>
                                Hi, {userData?.displayName || userData?.username || 'Guest'}!
                            </Text>
                            <Text style={styles.emailText}>{userData?.email || ''}</Text>
                        </View>
                        <View style={styles.headerRight}>
                            <View style={styles.homeDiamondCounter}>
                                <Text style={styles.homeDiamondText}>💎 {diamonds}</Text>
                            </View>
                            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                                <Text style={styles.logoutText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text style={styles.title}>🌳 Bird Sort Puzzle 🐦</Text>
                    <Text style={styles.subtitle}>1000 Levels of Fun!</Text>
                </View>

                {/* Progress Bar */}
                {progressInfo && (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>Progress</Text>
                            <Text style={styles.progressText}>
                                {progressInfo.totalCompleted} / 1000 ({progressInfo.percentComplete}%)
                            </Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: `${Math.max(progressInfo.percentComplete, 1)}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.nextLevelText}>
                            Next: Level {Math.min(progressInfo.nextUnlockedLevel, 1000)}
                        </Text>
                    </View>
                )}

                {/* Quick Jump */}
                <View style={styles.quickJump}>
                    <Text style={styles.quickJumpLabel}>Jump to Level:</Text>
                    <View style={styles.jumpInputRow}>
                        <TextInput
                            style={styles.jumpInput}
                            value={jumpToLevel}
                            onChangeText={setJumpToLevel}
                            keyboardType="number-pad"
                            placeholder={`1-${highestCompleted + 1}`}
                            maxLength={4}
                        />
                        <TouchableOpacity
                            style={styles.jumpButton}
                            onPress={handleJumpToLevel}
                        >
                            <Text style={styles.jumpButtonText}>GO</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Milestone Quick Select */}
                <View style={styles.milestonesContainer}>
                    <Text style={styles.sectionTitle}>Milestones</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.milestonesRow}>
                            {milestones.map((level) => {
                                const unlocked = isLevelUnlocked(level.id);
                                const completed = level.id <= highestCompleted;
                                return (
                                    <TouchableOpacity
                                        key={level.id}
                                        style={[
                                            styles.milestoneButton,
                                            { borderColor: getDifficultyColor(level.difficulty) },
                                            !unlocked && styles.milestoneButtonLocked,
                                            completed && styles.milestoneButtonCompleted,
                                        ]}
                                        onPress={() => handleStartLevel(level.id)}
                                    >
                                        {!unlocked && <Text style={styles.lockIcon}>🔒</Text>}
                                        {completed && <Text style={styles.checkIcon}>✓</Text>}
                                        <Text style={[styles.milestoneNumber, !unlocked && styles.textLocked]}>
                                            {level.id}
                                        </Text>
                                        <Text style={[
                                            styles.milestoneDifficulty,
                                            { color: unlocked ? getDifficultyColor(level.difficulty) : '#999' }
                                        ]}>
                                            {level.difficulty.split(' ')[0]}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>

                {/* Pagination Header */}
                <View style={styles.paginationHeader}>
                    <TouchableOpacity
                        style={[styles.pageButton, selectedPage === 0 && styles.pageButtonDisabled]}
                        onPress={() => handlePageChange(-1)}
                        disabled={selectedPage === 0}
                    >
                        <Text style={styles.pageButtonText}>◀</Text>
                    </TouchableOpacity>

                    <Text style={styles.pageInfo}>
                        Levels {startLevel} - {endLevel}
                    </Text>

                    <TouchableOpacity
                        style={[styles.pageButton, selectedPage >= totalPages - 1 && styles.pageButtonDisabled]}
                        onPress={() => handlePageChange(1)}
                        disabled={selectedPage >= totalPages - 1}
                    >
                        <Text style={styles.pageButtonText}>▶</Text>
                    </TouchableOpacity>
                </View>

                {/* Level Grid */}
                <View style={styles.levelGrid}>
                    {currentLevels.map((level) => {
                        const unlocked = isLevelUnlocked(level.id);
                        const completed = level.id <= highestCompleted;

                        return (
                            <TouchableOpacity
                                key={level.id}
                                style={[
                                    styles.levelCard,
                                    { borderLeftColor: getDifficultyColor(level.difficulty) },
                                    !unlocked && styles.levelCardLocked,
                                    completed && styles.levelCardCompleted,
                                ]}
                                onPress={() => handleStartLevel(level.id)}
                                activeOpacity={unlocked ? 0.7 : 1}
                            >
                                {!unlocked && (
                                    <View style={styles.lockOverlay}>
                                        <Text style={styles.lockEmoji}>🔒</Text>
                                    </View>
                                )}
                                {completed && (
                                    <View style={styles.completedBadge}>
                                        <Text style={styles.completedCheck}>✓</Text>
                                    </View>
                                )}
                                <Text style={[styles.levelNumber, !unlocked && styles.textLocked]}>
                                    {level.id}
                                </Text>
                                <Text style={[styles.levelBreeds, !unlocked && styles.textLocked]}>
                                    {level.breeds.length} types
                                </Text>
                                <View style={[
                                    styles.difficultyBadge,
                                    { backgroundColor: unlocked ? getDifficultyColor(level.difficulty) : '#CCC' }
                                ]}>
                                    <Text style={styles.difficultyText}>{level.difficulty.charAt(0)}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Instructions */}
                <View style={styles.instructions}>
                    <Text style={styles.instructionsTitle}>🎮 How to Play:</Text>
                    <Text style={styles.instructionText}>1. Tap a branch to select top birds</Text>
                    <Text style={styles.instructionText}>2. Tap another branch to move them</Text>
                    <Text style={styles.instructionText}>3. Fill a branch with 4 matching birds</Text>
                    <Text style={styles.instructionText}>4. Branch breaks - birds fly away!</Text>
                    <Text style={styles.instructionText}>5. Complete levels to unlock more!</Text>
                </View>

                {/* Reset Progress Button */}
                <TouchableOpacity
                    style={styles.resetButton}
                    onPress={handleResetProgress}
                >
                    <Text style={styles.resetButtonText}>Reset Progress</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#87CEEB',
    },
    scrollContent: {
        paddingBottom: 30,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 10,
        gap: 10,
    },
    profilePicture: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
    },
    userTextInfo: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    emailText: {
        fontSize: 12,
        color: '#7F8C8D',
    },
    logoutButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#95A5A6',
        borderRadius: 15,
    },
    logoutText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#2C3E50',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#7F8C8D',
        marginTop: 4,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    homeDiamondCounter: {
        backgroundColor: 'rgba(255,215,0,0.3)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#FFD700',
    },
    homeDiamondText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#5D4037',
    },
    progressContainer: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    progressText: {
        fontSize: 14,
        color: '#7F8C8D',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
    },
    nextLevelText: {
        fontSize: 12,
        color: '#3498DB',
        marginTop: 4,
        fontWeight: '600',
    },
    quickJump: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
    },
    quickJumpLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 8,
    },
    jumpInputRow: {
        flexDirection: 'row',
        gap: 10,
    },
    jumpInput: {
        flex: 1,
        borderWidth: 2,
        borderColor: '#3498DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        backgroundColor: '#F8F9FA',
    },
    jumpButton: {
        backgroundColor: '#3498DB',
        paddingHorizontal: 20,
        borderRadius: 8,
        justifyContent: 'center',
    },
    jumpButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    milestonesContainer: {
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 8,
    },
    milestonesRow: {
        flexDirection: 'row',
        gap: 8,
    },
    milestoneButton: {
        backgroundColor: 'white',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 2,
        alignItems: 'center',
        minWidth: 60,
        position: 'relative',
    },
    milestoneButtonLocked: {
        backgroundColor: '#E0E0E0',
        borderColor: '#BDBDBD',
    },
    milestoneButtonCompleted: {
        backgroundColor: '#E8F5E9',
    },
    milestoneNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    milestoneDifficulty: {
        fontSize: 10,
        fontWeight: '600',
    },
    lockIcon: {
        position: 'absolute',
        top: -8,
        right: -8,
        fontSize: 14,
    },
    checkIcon: {
        position: 'absolute',
        top: -8,
        right: -8,
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    paginationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    pageButton: {
        backgroundColor: '#3498DB',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    pageButtonDisabled: {
        backgroundColor: '#BDC3C7',
    },
    pageButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    pageInfo: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    levelGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 8,
    },
    levelCard: {
        width: '22%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        position: 'relative',
    },
    levelCardLocked: {
        backgroundColor: '#E0E0E0',
        borderLeftColor: '#BDBDBD',
    },
    levelCardCompleted: {
        backgroundColor: '#E8F5E9',
    },
    lockOverlay: {
        position: 'absolute',
        top: 2,
        right: 2,
    },
    lockEmoji: {
        fontSize: 12,
    },
    completedBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: '#4CAF50',
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    completedCheck: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    levelNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    levelBreeds: {
        fontSize: 10,
        color: '#7F8C8D',
        marginTop: 2,
    },
    textLocked: {
        color: '#999',
    },
    difficultyBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    difficultyText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    instructions: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 14,
        marginHorizontal: 20,
        marginTop: 14,
        borderRadius: 12,
    },
    instructionsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 6,
    },
    instructionText: {
        fontSize: 12,
        color: '#34495E',
        marginBottom: 3,
    },
    resetButton: {
        marginHorizontal: 20,
        marginTop: 16,
        padding: 12,
        backgroundColor: '#E74C3C',
        borderRadius: 8,
        alignItems: 'center',
    },
    resetButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default HomeScreen;
