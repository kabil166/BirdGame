import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { useNavigation } from '@react-navigation/native';
import { getLevel, getNextLevelId, GAME_CONFIG } from '../config/levels';
import { saveCompletedLevel } from '../utils/progressManager';
import LevelCompleteModal from '../components/LevelCompleteModal';

const GameScreen = ({ route }) => {
    console.log('[GameScreen] MOUNTING');
    const navigation = useNavigation();
    const levelId = route?.params?.levelId || 1;
    const [currentLevel, setCurrentLevel] = useState(getLevel(levelId));
    const [branches, setBranches] = useState([]);
    const [selectedBranchIndex, setSelectedBranchIndex] = useState(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [moveCount, setMoveCount] = useState(0);

    // Initialize Level Logic
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

    console.log('[GameScreen] Rendering - Branches:', branches.length);

    const onContextCreate = async (gl) => {
        console.log('[GameScreen] GL Context Created');

        // Setup renderer
        const renderer = new Renderer({ gl });
        renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
        renderer.setClearColor(0x87CEEB); // Sky blue background

        // Create scene
        const scene = new THREE.Scene();

        // Setup camera
        const camera = new THREE.PerspectiveCamera(
            50,
            gl.drawingBufferWidth / gl.drawingBufferHeight,
            0.1,
            1000
        );
        camera.position.set(0, 0, 10);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        scene.add(directionalLight);

        // Create test cube (orange)
        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFA500 });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(0, 0, 0);
        scene.add(cube);

        console.log('[GameScreen] Scene setup complete');

        // Animation loop
        const render = () => {
            requestAnimationFrame(render);

            // Rotate cube for visual feedback
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;

            renderer.render(scene, camera);
            gl.endFrameEXP();
        };
        render();

        console.log('[GameScreen] Animation loop started');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* 3D Scene */}
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
                <Text style={styles.title}>Level {currentLevel.id}</Text>
            </View>

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
        flexDirection: 'row', justifyContent: 'space-between', padding: 20
    },
    backBtn: { backgroundColor: 'white', padding: 10, borderRadius: 8 },
    text: { fontWeight: 'bold' },
    title: { fontSize: 20, fontWeight: 'bold', color: 'white' }
});

export default GameScreen;
