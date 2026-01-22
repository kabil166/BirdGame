import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getLevel, getNextLevelId, GAME_CONFIG } from '../config/levels';
import { saveCompletedLevel } from '../utils/progressManager';
import LevelCompleteModal from '../components/LevelCompleteModal';
import Software3DRenderer from '../lib/Software3DRenderer';
import { Vector3, Camera, createSphereMesh, createCylinderMesh } from '../lib/Software3D';
import { createBranchModel } from '../lib/Branch3DModel';

const { width, height } = Dimensions.get('window');

const GameScreen = ({ route }) => {
    const navigation = useNavigation();
    const levelId = route?.params?.levelId || 1;
    const [currentLevel, setCurrentLevel] = useState(getLevel(levelId));
    const [branches, setBranches] = useState([]);
    const [selectedBranchIndex, setSelectedBranchIndex] = useState(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [moveCount, setMoveCount] = useState(0);
    const [scene3D, setScene3D] = useState([]);

    const cameraRef = useRef(new Camera(new Vector3(0, 0, 12), 50));

    useEffect(() => {
        console.log('[GameScreen] Initialize Level', currentLevel.id);
        initializeLevel();
    }, [currentLevel]);

    const initializeLevel = () => {
        console.log('[GameScreen] initializeLevel started');
        const allBirds = [];
        currentLevel.breeds.forEach((breed) => {
            for (let i = 0; i < currentLevel.birdsPerBreed; i++) {
                allBirds.push(breed);
            }
        });
        const shuffled = allBirds.sort(() => Math.random() - 0.5);
        const newBranches = [];
        const filledBranches = currentLevel.breeds.length;
        const birdsPerBranch = currentLevel.maxBirdsPerBranch;

        for (let i = 0; i < currentLevel.totalBranches; i++) {
            if (i < filledBranches) {
                newBranches.push(shuffled.splice(0, birdsPerBranch));
            } else {
                newBranches.push([]);
            }
        }
        setBranches(newBranches);
        setSelectedBranchIndex(null);
        setMoveCount(0);
        setShowCompleteModal(false);

        // Build 3D scene
        build3DScene(newBranches);
    };

    const getBirdColor = (breed) => {
        switch (breed) {
            case 'red': return 0xFF4444; // Bright red
            case 'blue': return 0x4A90FF; // Bright blue
            case 'yellow': return 0xFFDD44; // Bright yellow  
            default: return 0x4A90FF;
        }
    };

    const build3DScene = (branchesData) => {
        const objects = [];

        // Create branches (cylinders)
        branchesData.forEach((branchBirds, branchIndex) => {
            const isLeft = branchIndex % 2 === 0;
            const rowIndex = Math.floor(branchIndex / 2);

            // Position branches in 3D space
            const x = isLeft ? -3 : 3;
            const y = 4 - rowIndex * 2;
            const z = 0;

            // Use detailed branch model with leaves
            const branchModel = createBranchModel(
                new Vector3(x, y, z),
                new Vector3(0, 0, 0), // rotation
                0.8 // scale
            );
            objects.push(branchModel);

            // Create birds on this branch
            branchBirds.forEach((birdBreed, birdIndex) => {
                const birdX = x + (isLeft ? 1 : -1) * (1.5 - birdIndex * 0.6);
                const birdY = y + 0.3;

                const bird = createSphereMesh(
                    new Vector3(birdX, birdY, z),
                    0.3,
                    getBirdColor(birdBreed)
                );

                // Static rotation based on position for visual variety
                bird.rotation = new Vector3(0, birdIndex * 0.5, 0);
                objects.push(bird);
            });
        });

        setScene3D(objects);
    };

    const handleBranchPress = (index) => {
        console.log('[GameScreen] Branch Pressed', index);
        if (selectedBranchIndex === null) {
            if (branches[index].length > 0) setSelectedBranchIndex(index);
        } else if (selectedBranchIndex === index) {
            setSelectedBranchIndex(null);
        } else {
            moveBirds(selectedBranchIndex, index);
        }
    };

    const moveBirds = (from, to) => {
        console.log('[GameScreen] Move Birds', from, to);
        const fromBranch = [...branches[from]];
        const toBranch = [...branches[to]];
        if (fromBranch.length === 0) return setSelectedBranchIndex(null);
        const bird = fromBranch[fromBranch.length - 1];

        if (toBranch.length < currentLevel.maxBirdsPerBranch) {
            if (toBranch.length === 0 || toBranch[toBranch.length - 1] === bird) {
                toBranch.push(fromBranch.pop());

                const newBranches = [...branches];
                newBranches[from] = fromBranch;
                newBranches[to] = toBranch;
                setBranches(newBranches);
                setMoveCount(c => c + 1);
                build3DScene(newBranches);
                checkWin(newBranches);
            }
        }
        setSelectedBranchIndex(null);
    };

    const checkWin = (currentBranches) => {
        const isWin = currentBranches.every(branch => {
            if (branch.length === 0) return true;
            if (branch.length !== currentLevel.birdsPerBreed) return false;
            return branch.every(b => b === branch[0]);
        });

        if (isWin) {
            console.log('[GameScreen] Win Condition Met');
            setTimeout(() => setShowCompleteModal(true), 500);
            saveCompletedLevel(currentLevel.id, 3);
        }
    };

    const handleNextLevel = () => {
        const nextId = getNextLevelId(currentLevel.id);
        if (nextId) setCurrentLevel(getLevel(nextId));
        else navigation.navigate('Home');
    };

    const onRenderFrame = () => {
        // Animation loop - no state updates to avoid infinite renders
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* 3D Renderer */}
            <Software3DRenderer
                objects={scene3D}
                camera={cameraRef.current}
                onRender={onRenderFrame}
                style={styles.renderer}
            />

            {/* UI Overlay */}
            <View style={styles.uiOverlay}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
                    <Text style={styles.text}>Back</Text>
                </TouchableOpacity>
                <View style={styles.centerInfo}>
                    <Text style={styles.title}>Level {currentLevel.id}</Text>
                    <Text style={styles.subtitle}>Software 3D</Text>
                </View>
                <Text style={styles.moves}>Moves: {moveCount}</Text>
            </View>

            {/* Touch areas for branches */}
            {branches.map((_, index) => {
                const isLeft = index % 2 === 0;
                const rowIndex = Math.floor(index / 2);

                return (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.branchTouchArea,
                            {
                                top: 150 + rowIndex * 120,
                                [isLeft ? 'left' : 'right']: 10,
                                borderColor: selectedBranchIndex === index ? '#FFD700' : 'rgba(255,255,255,0.3)',
                                borderWidth: selectedBranchIndex === index ? 3 : 2,
                            }
                        ]}
                        onPress={() => handleBranchPress(index)}
                    >
                        {selectedBranchIndex === index && (
                            <Text style={styles.selectedText}>✓</Text>
                        )}
                    </TouchableOpacity>
                );
            })}

            <LevelCompleteModal
                visible={showCompleteModal}
                level={currentLevel.id}
                onNextLevel={handleNextLevel}
                onRestart={initializeLevel}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e'
    },
    renderer: {
        flex: 1,
    },
    uiOverlay: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        zIndex: 10,
    },
    backBtn: {
        backgroundColor: 'white',
        padding: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        elevation: 3,
    },
    text: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    centerInfo: {
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    subtitle: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600',
    },
    moves: {
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 8,
        paddingHorizontal: 12,
        borderRadius: 15,
    },
    branchTouchArea: {
        position: 'absolute',
        width: 140,
        height: 90,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    selectedText: {
        fontSize: 30,
        color: '#FFD700',
        fontWeight: 'bold',
    }
});

export default GameScreen;
