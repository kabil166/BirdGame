/**
 * Software3DRenderer - React Native component that renders 3D scenes using SVG
 */

import React, { useRef, useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Circle, Ellipse, Rect, G, Line, Path } from 'react-native-svg';
import { Vector3, Camera, Matrix4, calculateLighting } from './Software3D';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const Software3DRenderer = ({
    objects = [],
    camera,
    onRender,
    style = {},
    backgroundColor = '#87CEEB'
}) => {
    const animationFrameRef = useRef(null);
    const [renderKey, setRenderKey] = React.useState(0);

    useEffect(() => {
        // Animation loop
        const animate = () => {
            setRenderKey(k => k + 1);
            if (onRender) onRender();
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [onRender]);

    const lightDirection = new Vector3(0.5, -1, -0.5);

    // Render each object
    const renderObject = (obj, index) => {
        if (obj.type === 'sphere') {
            return renderSphere(obj, index);
        } else if (obj.type === 'cylinder') {
            return renderCylinder(obj, index);
        } else if (obj.type === 'leaf') {
            return renderLeaf(obj, index);
        } else if (obj.type === 'branch_model') {
            // Render all parts of the branch
            return obj.parts.map((part, partIndex) =>
                renderObject(part, `${index}-${partIndex}`)
            );
        }
        return null;
    };

    const renderSphere = (sphere, index) => {
        // Apply rotation if any
        let pos = sphere.position;
        if (sphere.rotation) {
            const rotY = Matrix4.rotationY(sphere.rotation.y);
            const rotX = Matrix4.rotationX(sphere.rotation.x);
            pos = rotX.apply(rotY.apply(pos));
        }

        // Project to screen
        const projected = camera.project(pos, SCREEN_WIDTH, SCREEN_HEIGHT);
        if (!projected) return null;

        // Scale radius based on depth
        const screenRadius = sphere.radius * 50 * projected.scale;

        // Calculate lighting (simple top-down light)
        const normal = new Vector3(0, 1, 0); // Top of sphere
        const litColor = calculateLighting(normal, lightDirection, sphere.color);

        return (
            <G key={`sphere-${index}`}>
                {/* Shadow (slightly below and darker) */}
                <Circle
                    cx={projected.x + 2}
                    cy={projected.y + 5}
                    r={screenRadius * 0.8}
                    fill="rgba(0,0,0,0.2)"
                />
                {/* Main sphere body */}
                <Circle
                    cx={projected.x}
                    cy={projected.y}
                    r={screenRadius}
                    fill={litColor}
                    opacity={0.95}
                />
                {/* Mid-tone for depth */}
                <Circle
                    cx={projected.x}
                    cy={projected.y}
                    r={screenRadius * 0.7}
                    fill={`rgba(255,255,255,0.15)`}
                />
                {/* Highlight (fake specular) */}
                <Circle
                    cx={projected.x - screenRadius * 0.25}
                    cy={projected.y - screenRadius * 0.25}
                    r={screenRadius * 0.25}
                    fill="rgba(255,255,255,0.6)"
                />
            </G>
        );
    };

    const renderCylinder = (cylinder, index) => {
        // For cylinder, render as a 3D-looking rectangle with perspective

        // Apply rotation
        const rotZ = Matrix4.rotationZ(cylinder.rotation.z || 0);
        const rotY = Matrix4.rotationY(cylinder.rotation.y || 0);

        // Calculate cylinder endpoints
        const halfHeight = cylinder.height / 2;
        const left = new Vector3(cylinder.position.x - halfHeight, cylinder.position.y, cylinder.position.z);
        const right = new Vector3(cylinder.position.x + halfHeight, cylinder.position.y, cylinder.position.z);

        // Apply rotations
        const rotatedLeft = rotY.apply(rotZ.apply(left));
        const rotatedRight = rotY.apply(rotZ.apply(right));

        // Project both endpoints
        const projectedLeft = camera.project(rotatedLeft, SCREEN_WIDTH, SCREEN_HEIGHT);
        const projectedRight = camera.project(rotatedRight, SCREEN_WIDTH, SCREEN_HEIGHT);

        if (!projectedLeft || !projectedRight) return null;

        // Calculate width based on depth
        const widthLeft = cylinder.radius * 50 * projectedLeft.scale;
        const widthRight = cylinder.radius * 50 * projectedRight.scale;

        // Calculate lighting
        const normal = new Vector3(0, 1, 0);
        const litColor = calculateLighting(normal, lightDirection, cylinder.color);

        // Draw as trapezoid (approximation of cylinder)
        const topLeft = { x: projectedLeft.x, y: projectedLeft.y - widthLeft };
        const bottomLeft = { x: projectedLeft.x, y: projectedLeft.y + widthLeft };
        const topRight = { x: projectedRight.x, y: projectedRight.y - widthRight };
        const bottomRight = { x: projectedRight.x, y: projectedRight.y + widthRight };

        const pathData = `
            M ${topLeft.x} ${topLeft.y}
            L ${topRight.x} ${topRight.y}
            L ${bottomRight.x} ${bottomRight.y}
            L ${bottomLeft.x} ${bottomLeft.y}
            Z
        `;

        return (
            <G key={`cylinder-${index}`}>
                <Path
                    d={pathData}
                    fill={litColor}
                    opacity={0.9}
                />
                {/* Left cap (ellipse) */}
                <Ellipse
                    cx={projectedLeft.x}
                    cy={projectedLeft.y}
                    rx={widthLeft}
                    ry={widthLeft * 0.3}
                    fill={litColor}
                />
            </G>
        );
    };

    const renderLeaf = (leaf, index) => {
        // Project leaf position to screen
        const projected = camera.project(leaf.position, SCREEN_WIDTH, SCREEN_HEIGHT);
        if (!projected) return null;

        // Scale based on depth
        const width = leaf.size.width * 50 * projected.scale;
        const height = leaf.size.height * 50 * projected.scale;

        // Calculate lighting
        const normal = new Vector3(0, 1, 0.5).normalize();
        const litColor = calculateLighting(normal, lightDirection, leaf.color);

        // Rotate leaf for visual variety
        const rotation = leaf.rotation.z * (180 / Math.PI);

        return (
            <G key={`leaf-${index}`} transform={`rotate(${rotation} ${projected.x} ${projected.y})`}>
                {/* Leaf shadow */}
                <Ellipse
                    cx={projected.x + 1}
                    cy={projected.y + 2}
                    rx={width}
                    ry={height}
                    fill="rgba(0,0,0,0.15)"
                />
                {/* Main leaf body */}
                <Ellipse
                    cx={projected.x}
                    cy={projected.y}
                    rx={width}
                    ry={height}
                    fill={litColor}
                    opacity={0.85}
                />
                {/* Leaf vein (center line) */}
                <Line
                    x1={projected.x}
                    y1={projected.y - height}
                    x2={projected.x}
                    y2={projected.y + height}
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth={1}
                />
                {/* Highlight on leaf */}
                <Ellipse
                    cx={projected.x - width * 0.2}
                    cy={projected.y - height * 0.2}
                    rx={width * 0.3}
                    ry={height * 0.3}
                    fill="rgba(255,255,255,0.25)"
                />
            </G>
        );
    };

    // Sort objects by depth (painter's algorithm)
    const sortedObjects = [...objects].sort((a, b) => {
        const depthA = camera.project(a.position, SCREEN_WIDTH, SCREEN_HEIGHT)?.depth || 0;
        const depthB = camera.project(b.position, SCREEN_WIDTH, SCREEN_HEIGHT)?.depth || 0;
        return depthA - depthB; // Render far objects first
    });

    return (
        <View style={[{ flex: 1, backgroundColor }, style]}>
            <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
                {sortedObjects.map((obj, index) => renderObject(obj, index))}
            </Svg>
        </View>
    );
};

export default Software3DRenderer;
