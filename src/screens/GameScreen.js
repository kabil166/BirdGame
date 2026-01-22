import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    SafeAreaView,
    Animated,
    Image,
    ImageBackground,
    Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import LevelCompleteModal from '../components/LevelCompleteModal';
import { getLevel, getNextLevelId, GAME_CONFIG, BIRD_COLORS, TOTAL_LEVELS } from '../config/levels';
import { saveCompletedLevel } from '../utils/progressManager';
import economyService from '../services/economyService';

const { width, height } = Dimensions.get('window');

const GameScreen = ({ route }) => {
    const navigation = useNavigation();
    const levelId = route?.params?.levelId || 1;

    const [currentLevel, setCurrentLevel] = useState(getLevel(levelId));

    // Each branch is an array of bird breeds (strings)
    // Birds are stacked bottom to top, index 0 is bottom
    const [branches, setBranches] = useState([]);
    const [selectedBranchIndex, setSelectedBranchIndex] = useState(null);
    const [flyingBirds, setFlyingBirds] = useState(null);
    const [matchedBranches, setMatchedBranches] = useState(new Set());
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [moveCount, setMoveCount] = useState(0);
    const [diamonds, setDiamonds] = useState(0);
    const [extraBranches, setExtraBranches] = useState(0);

    // Animation values for flying birds
    const flyAnimation = useRef(new Animated.ValueXY()).current;
    const flyOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        initializeLevel();
    }, [currentLevel]);

    useEffect(() => {
        // Load diamonds
        const loadDiamonds = async () => {
            const count = await economyService.getDiamonds();
            setDiamonds(count);
        };
        loadDiamonds();

        // Subscribe to diamond changes
        const unsubscribe = economyService.subscribe((newCount) => {
            setDiamonds(newCount);
        });

        return () => unsubscribe();
    }, []);

    const initializeLevel = () => {
        // Create all birds
        const allBirds = [];
        currentLevel.breeds.forEach((breed) => {
            for (let i = 0; i < currentLevel.birdsPerBreed; i++) {
                allBirds.push(breed);
            }
        });

        // Shuffle birds
        const shuffled = allBirds.sort(() => Math.random() - 0.5);

        // Distribute across branches (leaving some empty)
        const newBranches = [];
        const filledBranches = currentLevel.breeds.length; // Number of branches with birds
        const birdsPerBranch = currentLevel.maxBirdsPerBranch;

        for (let i = 0; i < currentLevel.totalBranches; i++) {
            if (i < filledBranches) {
                // Fill this branch with birds
                const branchBirds = shuffled.splice(0, birdsPerBranch);
                newBranches.push(branchBirds);
            } else {
                // Empty branch
                newBranches.push([]);
            }
        }

        setBranches(newBranches);
        setSelectedBranchIndex(null);
        setMatchedBranches(new Set());
        setShowCompleteModal(false);
        setMoveCount(0);
        setFlyingBirds(null);
    };

    const getTopBirdsOfSameType = (branchIndex) => {
        const branch = branches[branchIndex];
        if (!branch || branch.length === 0) return [];

        // Get consecutive birds of same type from top
        const topBird = branch[branch.length - 1];
        const sameBirds = [];

        for (let i = branch.length - 1; i >= 0; i--) {
            if (branch[i] === topBird) {
                sameBirds.push(branch[i]);
            } else {
                break;
            }
        }

        return sameBirds;
    };

    const canMoveTo = (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return false;

        const fromBranch = branches[fromIndex];
        const toBranch = branches[toIndex];

        // Can't move from empty/broken branch
        if (!fromBranch || fromBranch.length === 0) return false;

        // Can't move to a broken branch
        if (toBranch === null) return false;

        const topBirds = getTopBirdsOfSameType(fromIndex);
        const movingType = topBirds[0];

        // Target branch is empty (not broken) - can always move
        if (toBranch.length === 0) return true;

        // Target branch is full
        if (toBranch.length >= currentLevel.maxBirdsPerBranch) return false;

        // Target branch top bird must match
        const targetTopBird = toBranch[toBranch.length - 1];
        if (targetTopBird !== movingType) return false;

        // Check if there's enough space
        const availableSpace = currentLevel.maxBirdsPerBranch - toBranch.length;
        return availableSpace > 0;
    };

    const handleBranchPress = (branchIndex) => {
        if (flyingBirds) return; // Animation in progress

        if (selectedBranchIndex === null) {
            // Select this branch if it has birds
            if (branches[branchIndex] && branches[branchIndex].length > 0) {
                setSelectedBranchIndex(branchIndex);
            }
        } else if (selectedBranchIndex === branchIndex) {
            // Deselect
            setSelectedBranchIndex(null);
        } else {
            // Try to move birds
            if (canMoveTo(selectedBranchIndex, branchIndex)) {
                moveBirds(selectedBranchIndex, branchIndex);
            } else {
                // Select this branch instead if it has birds
                if (branches[branchIndex] && branches[branchIndex].length > 0) {
                    setSelectedBranchIndex(branchIndex);
                } else {
                    setSelectedBranchIndex(null);
                }
            }
        }
    };

    const moveBirds = (fromIndex, toIndex) => {
        const fromBranch = [...branches[fromIndex]];
        const toBranch = [...branches[toIndex]];
        const topBirds = getTopBirdsOfSameType(fromIndex);
        const movingType = topBirds[0];

        // Calculate how many birds can actually move
        const availableSpace = currentLevel.maxBirdsPerBranch - toBranch.length;
        const birdsToMove = Math.min(topBirds.length, availableSpace);

        // Remove birds from source
        const movedBirds = fromBranch.splice(-birdsToMove, birdsToMove);

        // Add to destination
        toBranch.push(...movedBirds);

        // Update state
        const newBranches = [...branches];
        newBranches[fromIndex] = fromBranch;
        newBranches[toIndex] = toBranch;

        setBranches(newBranches);
        setSelectedBranchIndex(null);
        setMoveCount((prev) => prev + 1);

        // Check for completed branch
        setTimeout(() => checkForMatch(newBranches, toIndex), 200);
    };

    const checkForMatch = async (currentBranches, branchIndex) => {
        const branch = currentBranches[branchIndex];
        if (!branch) return; // Branch already broken

        // Check if branch is full with all same type
        if (branch.length === currentLevel.maxBirdsPerBranch) {
            const firstBird = branch[0];
            const allSame = branch.every((bird) => bird === firstBird);

            if (allSame) {
                // Match found! Fly birds away and break branch
                setMatchedBranches((prev) => new Set(prev).add(branchIndex));

                setTimeout(async () => {
                    // Mark branch as broken (null) - can't be reused
                    const newBranches = [...currentBranches];
                    newBranches[branchIndex] = null; // Branch is broken!
                    setBranches(newBranches);

                    // Check for level complete
                    await checkLevelComplete(newBranches);
                }, GAME_CONFIG.matchCelebrationDelay);
            }
        }
    };

    const checkLevelComplete = async (currentBranches) => {
        // Count remaining birds (skip broken/null branches)
        const remainingBirds = currentBranches.reduce(
            (sum, branch) => sum + (branch ? branch.length : 0),
            0
        );

        if (remainingBirds === 0) {
            // Calculate stars based on moves (simple formula - can be adjusted)
            const targetMoves = currentLevel.breeds.length * 2; // Example target
            let stars = 3;
            if (moveCount > targetMoves * 1.5) stars = 2;
            if (moveCount > targetMoves * 2) stars = 1;

            console.log(`[GameScreen] Level ${currentLevel.id} completed! Saving...`);

            // Save progress to Firestore - USE currentLevel.id, not levelId!
            const saveResult = await saveCompletedLevel(currentLevel.id, stars);

            if (saveResult?.diamondsAwarded) {
                console.log(`💎 GAME: Awarded ${saveResult.diamondsAwarded} diamond(s)! Total: ${saveResult.totalDiamonds}`);
            }

            setTimeout(() => {
                setShowCompleteModal(true);
            }, 500);
        }
    };

    const handleNextLevel = () => {
        const nextLevelId = getNextLevelId(currentLevel.id);
        if (nextLevelId) {
            setCurrentLevel(getLevel(nextLevelId));
        } else {
            // Completed all 1000 levels!
            navigation.navigate('Home');
        }
    };

    const purchaseExtraBranch = async () => {
        const EXTRA_BRANCH_COST = 5;

        if (diamonds < EXTRA_BRANCH_COST) {
            Alert.alert(
                '💎 Insufficient Diamonds',
                `You need ${EXTRA_BRANCH_COST} diamonds to add a branch. You have ${diamonds}.`,
                [{ text: 'OK' }]
            );
            return;
        }

        Alert.alert(
            '🌿 Add Extra Branch?',
            `Cost: ${EXTRA_BRANCH_COST} diamonds\n\nThis will add one empty branch to help you solve this level.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Purchase',
                    onPress: async () => {
                        try {
                            await economyService.spendDiamonds(EXTRA_BRANCH_COST);

                            // Add empty branch to game
                            const newBranches = [...branches, []];
                            setBranches(newBranches);
                            setExtraBranches(prev => prev + 1);

                            Alert.alert('✅ Success!', 'Extra branch added!');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to purchase branch');
                        }
                    }
                }
            ]
        );
    };

    const handleRestart = () => {
        initializeLevel();
    };

    const handleBackToHome = () => {
        navigation.navigate('Home');
    };

    const renderBird = (breed, index, isSelected, isTop, isLeftBranch) => {
        const size = GAME_CONFIG.birdSize;
        const spacing = size * 0.8; // Overlap slightly

        // Use 2D assets
        let source;
        switch (breed) {
            case 'red': source = require('../../assets/bird_red_2d.png'); break;
            case 'blue': source = require('../../assets/bird_blue_2d.png'); break;
            case 'yellow': source = require('../../assets/bird_yellow_2d.png'); break;
            default: source = require('../../assets/bird_blue_2d.png');
        }

        // Horizontal position based on index (dynamic)
        const positionStyle = isLeftBranch
            ? { left: index * spacing }
            : { right: index * spacing };

        return (
            <Animated.Image
                key={index}
                source={source}
                style={[
                    styles.bird,
                    positionStyle,
                    {
                        width: size,
                        height: size,
                        bottom: isSelected && isTop ? 15 : 5, // Jump up if selected
                        borderWidth: isSelected && isTop ? 0 : 0, // No border, jump instead
                        // borderColor: '#FFD700',
                        // borderRadius: size / 2,
                        transform: [
                            { scale: isSelected && isTop ? 1.1 : 1 },
                            { scaleX: isLeftBranch ? 1 : -1 } // Flip bird to face center?
                        ],
                    },
                ]}
                resizeMode="contain"
            />
        );
    };

    const renderBranch = (birds, branchIndex) => {
        if (birds === null) return null;

        const isSelected = selectedBranchIndex === branchIndex;
        const isMatched = matchedBranches.has(branchIndex);
        const canReceive =
            selectedBranchIndex !== null &&
            selectedBranchIndex !== branchIndex &&
            canMoveTo(selectedBranchIndex, branchIndex);

        // Determine side based on index (even = Left, odd = Right)
        const isLeft = branchIndex % 2 === 0;
        const branchSource = isLeft
            ? require('../../assets/branch_left.png')
            : require('../../assets/branch_right.png');

        // Dynamic Layout Calculations
        const totalRows = Math.ceil(currentLevel.totalBranches / 2);
        // Available height excludes header (~100) and bottom/ground (~50)
        const availableHeight = height - 150;
        const rowHeight = Math.min(180, availableHeight / totalRows); // Cap max height

        // Vertical Position
        const rowIndex = Math.floor(branchIndex / 2);
        const topPosition = 110 + rowIndex * rowHeight; // Start getting pushed down by header

        // Branch Sizing
        const BRANCH_WIDTH = width * 0.6; // 60% of screen width
        const HORIZONTAL_OFFSET = -40; // Push branches further to edges

        // Bird Container Start Offset (where birds start sitting)
        const BIRD_START_OFFSET = BRANCH_WIDTH * .25; // 15% into the branch

        // SVG Path Definition
        // Adjust these curves to match your specific branch images
        const leftPath = `M0,50 Q${BRANCH_WIDTH * 0.5},${65} ${BRANCH_WIDTH},40`;
        const rightPath = `M0,40 Q${BRANCH_WIDTH * 0.5},${65} ${BRANCH_WIDTH},50`; // Mirrored-ish

        return (
            <TouchableOpacity
                key={branchIndex}
                style={[
                    styles.branchContainer,
                    {
                        width: BRANCH_WIDTH,
                        height: 120, // Fixed height for visual consistency
                        top: topPosition,
                        // Horizontal positioning
                        [isLeft ? 'left' : 'right']: HORIZONTAL_OFFSET,
                        alignItems: isLeft ? 'flex-start' : 'flex-end',
                    }
                ]}
                onPress={() => handleBranchPress(branchIndex)}
                activeOpacity={0.8}
            >
                {/* Branch Image */}
                <Image
                    source={branchSource}
                    style={styles.branchImage}
                    resizeMode="contain"
                />

                {/* Highlight/Selection Overlay */}
                {(isSelected || canReceive || isMatched) && (
                    <View style={[
                        styles.branchOverlay,
                        isSelected && styles.branchSelected,
                        canReceive && styles.branchCanReceive,
                        isMatched && styles.branchMatched,
                    ]} />
                )}

                {/* Birds on the branch */}
                <View style={[
                    styles.birdsContainer,
                    isLeft ? { left: BIRD_START_OFFSET } : { right: BIRD_START_OFFSET }
                ]}>
                    {birds.map((bird, index) => {
                        const topBirds = isSelected ? getTopBirdsOfSameType(branchIndex) : [];
                        const isTop = index >= birds.length - topBirds.length;
                        return renderBird(bird, index, isSelected, isTop, isLeft);
                    })}
                </View>

                {/* Tap Hint */}
                {canReceive && (
                    <View style={styles.dropHighlight}>
                        <Text style={styles.dropText}>TAP</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <ImageBackground
            source={require('../../assets/game_bg_2d.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.levelTitle}>{currentLevel.name}</Text>
                        <View style={styles.statsRow}>
                            <Text style={styles.moveCounter}>Moves: {moveCount}</Text>
                            <View style={styles.diamondCounter}>
                                <Text style={styles.diamondText}>💎 {diamonds}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        {/* <TouchableOpacity
                            style={[styles.powerUpButton, diamonds < 5 && styles.powerUpButtonDisabled]}
                            onPress={purchaseExtraBranch}
                            disabled={diamonds < 5}
                        >
                            <Text style={styles.powerUpText}>🌿</Text>
                            <Text style={styles.powerUpCost}>5💎</Text>
                        </TouchableOpacity> */}
                        <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
                            <Text style={styles.restartButtonText}>🔄</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Game Area */}
                <View style={styles.gameArea}>
                    {/* Render Branches with absolute positioning handled in styles */}
                    {branches.map((birds, index) => renderBranch(birds, index))}
                </View>

                <LevelCompleteModal
                    visible={showCompleteModal}
                    level={currentLevel.id}
                    onNextLevel={handleNextLevel}
                    onRestart={handleRestart}
                />
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.4)', // Slightly transparent
        marginHorizontal: 16,
        marginTop: 10,
        borderRadius: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        backgroundColor: '#fff',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    backButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#8B4513',
    },
    headerCenter: {
        alignItems: 'center',
    },
    levelTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#5D4037', // Dark brown
        textShadowColor: 'rgba(255, 255, 255, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    moveCounter: {
        fontSize: 14,
        color: '#5D4037',
        fontWeight: '600',
        marginRight: 10,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    diamondCounter: {
        backgroundColor: 'rgba(255,215,0,0.3)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    diamondText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#5D4037',
    },
    headerRight: {
        flexDirection: 'row',
        gap: 8,
    },
    powerUpButton: {
        width: 50,
        height: 40,
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    powerUpButtonDisabled: {
        backgroundColor: '#CCCCCC',
        opacity: 0.6,
    },
    powerUpText: {
        fontSize: 16,
    },
    powerUpCost: {
        fontSize: 9,
        fontWeight: 'bold',
        color: 'white',
    },
    restartButton: {
        width: 40,
        height: 40,
        backgroundColor: '#fff',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    restartButtonText: {
        fontSize: 20,
    },
    gameArea: {
        flex: 1,
        position: 'relative',
        marginTop: 20,
        width: '100%',
    },
    branchContainer: {
        position: 'absolute',
        justifyContent: 'center',
    },
    branchImage: {
        width: '100%',
        height: '100%',
    },
    branchOverlay: {
        position: 'absolute',
        top: 40, // align with visual branch part
        width: '80%',
        height: 20,
        borderRadius: 10,
        zIndex: -1,
    },
    // branchSelected: {
    //     // backgroundColor: 'rgba(255, 215, 0, 0.4)', // Removed per user request
    //     borderWidth: 2,
    //     borderColor: '#FFD700',
    // },
    // branchCanReceive: {
    //     backgroundColor: 'rgba(46, 204, 113, 0.4)', // Green glow
    //     borderWidth: 2,
    //     borderColor: '#2ECC71',
    // },
    branchMatched: {
        backgroundColor: 'rgba(155, 89, 182, 0.4)', // Purple glow
    },
    birdsContainer: {
        position: 'absolute',
        top: 0, // Raised from 35 to 50 per user request
        width: '100%',
        height: 60,
        // No alignItems or flexDirection, using absolute positioning for birds
    },
    bird: {
        position: 'absolute',
        // Styling handled inline for Image
        elevation: 0,
    },
    dropHighlight: {
        position: 'absolute',
        top: -20,
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        zIndex: 10,
    },
    dropText: {
        fontWeight: 'bold',
        color: '#27AE60',
        fontSize: 12,
    },
    // Removed old obsolete styles
});

export default GameScreen;
