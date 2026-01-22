import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, Platform } from 'react-native';
import { GLView } from 'expo-gl';
import { useNavigation } from '@react-navigation/native';
import { getLevel, getNextLevelId, GAME_CONFIG } from '../config/levels';
import { saveCompletedLevel } from '../utils/progressManager';
import LevelCompleteModal from '../components/LevelCompleteModal';
import * as THREE from 'three';

const GameScreen = ({ route }) => {
    const navigation = useNavigation();
    const levelId = route?.params?.levelId || 1;
    const [currentLevel, setCurrentLevel] = useState(getLevel(levelId));
    const [branches, setBranches] = useState([]);
    const [selectedBranchIndex, setSelectedBranchIndex] = useState(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [moveCount, setMoveCount] = useState(0);

    // Refs for Three.js objects
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const objectsRef = useRef({ branches: [], birds: [] });

    useEffect(() => {
        console.log('[GameScreen] useEffect - Initialize Level', currentLevel.id);
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
        console.log('[GameScreen] initializeLevel completed', newBranches.length);

        // Update 3D scene if it exists
        if (sceneRef.current) {
            update3DObjects(newBranches);
        }
    };

    const moveBirds = (from, to) => {
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
                update3DObjects(newBranches);
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

    const handleBranchPress = (index) => {
        if (selectedBranchIndex === null) {
            if (branches[index].length > 0) setSelectedBranchIndex(index);
        } else if (selectedBranchIndex === index) {
            setSelectedBranchIndex(null);
        } else {
            moveBirds(selectedBranchIndex, index);
        }
    };

    const handleNextLevel = () => {
        const nextId = getNextLevelId(currentLevel.id);
        if (nextId) setCurrentLevel(getLevel(nextId));
        else navigation.navigate('Home');
    };

    const getBirdColor = (breed) => {
        switch (breed) {
            case 'red': return 0xE74C3C;
            case 'blue': return 0x4A90E2;
            case 'yellow': return 0xF1C40F;
            default: return 0x4A90E2;
        }
    };

    const update3DObjects = (branchesData) => {
        if (!sceneRef.current) return;

        const scene = sceneRef.current;

        // Clear existing birds
        objectsRef.current.birds.forEach(bird => scene.remove(bird));
        objectsRef.current.birds = [];

        // Create birds for each branch
        branchesData.forEach((branchBirds, branchIndex) => {
            const isLeft = branchIndex % 2 === 0;
            const yPos = 3 - branchIndex * 1.5;
            const xPos = isLeft ? -2 : 2;

            branchBirds.forEach((bird, birdIndex) => {
                const geometry = new THREE.SphereGeometry(0.3, 16, 16);
                const material = new THREE.MeshStandardMaterial({
                    color: getBirdColor(bird)
                });
                const birdMesh = new THREE.Mesh(geometry, material);

                const xOffset = isLeft ? -1 + birdIndex * 0.5 : 1 - birdIndex * 0.5;
                birdMesh.position.set(xPos + xOffset, yPos + 0.4, 0);

                scene.add(birdMesh);
                objectsRef.current.birds.push(birdMesh);
            });
        });
    };

    const onContextCreate = (gl) => {
        console.log('[GameScreen] GL Context Created - Manual Setup');

        const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

        // Create custom WebGLRenderer properties
        const renderer = new THREE.WebGLRenderer({
            canvas: {
                width: width,
                height: height,
                style: {},
                addEventListener: () => { },
                removeEventListener: () => { },
                clientHeight: height,
                getContext: () => gl,
            },
            context: gl,
        });

        renderer.setSize(width, height);
        renderer.setClearColor(0x87CEEB);
        rendererRef.current = renderer;

        // Create scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Setup camera
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        camera.position.set(0, 0, 10);
        cameraRef.current = camera;

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        scene.add(directionalLight);

        // Create branches (cylinders)
        const branchGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 16);
        const branchMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });

        for (let i = 0; i < currentLevel.totalBranches; i++) {
            const isLeft = i % 2 === 0;
            const yPos = 3 - i * 1.5;
            const xPos = isLeft ? -2 : 2;

            const branch = new THREE.Mesh(branchGeometry, branchMaterial);
            branch.position.set(xPos, yPos, 0);
            branch.rotation.z = Math.PI / 2;
            scene.add(branch);
            objectsRef.current.branches.push(branch);
        }

        // Initial bird setup
        update3DObjects(branches);

        console.log('[GameScreen] Scene setup complete');

        // Animation loop
        const render = () => {
            requestAnimationFrame(render);

            // Rotate birds slightly for visual interest
            objectsRef.current.birds.forEach(bird => {
                bird.rotation.y += 0.01;
            });

            renderer.render(scene, camera);
            gl.endFrameEXP();
        };
        render();

        console.log('[GameScreen] Animation loop started');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.gameArea}>
                <GLView
                    style={{ flex: 1 }}
                    onContextCreate={onContextCreate}
                />
            </View>

            {/* UI Overlay */}
            <View style={styles.uiOverlay}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
                    <Text style={styles.text}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Level {currentLevel.id} (3D)</Text>
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
                                top: 200 + rowIndex * 120,
                                [isLeft ? 'left' : 'right']: 20,
                                backgroundColor: selectedBranchIndex === index ? 'rgba(255,215,0,0.3)' : 'transparent'
                            }
                        ]}
                        onPress={() => handleBranchPress(index)}
                    />
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
    container: { flex: 1, backgroundColor: '#87CEEB' },
    gameArea: { flex: 1 },
    uiOverlay: {
        position: 'absolute', top: 50, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20
    },
    backBtn: { backgroundColor: 'white', padding: 10, borderRadius: 8 },
    text: { fontWeight: 'bold' },
    title: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    moves: { fontSize: 14, color: 'white', fontWeight: 'bold' },
    branchTouchArea: {
        position: 'absolute',
        width: 150,
        height: 100,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    }
});

export default GameScreen;
