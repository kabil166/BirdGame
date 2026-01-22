/**
 * Branch3DModel - Designed to match branch_right.png style
 * A curved branch with small leaves along the top
 */

import { Vector3 } from './Software3D';

// Create a branch that matches the cartoon 2D style
export function createBranchModel(position, rotation, scale = 1) {
    const parts = [];

    // Main trunk - curved upward (multiple segments for curve effect)
    const segments = 8;
    const trunkLength = 3.5 * scale;
    const segmentLength = trunkLength / segments;

    for (let i = 0; i < segments; i++) {
        const progress = i / segments;
        const x = position.x + (progress * trunkLength);
        const y = position.y + (Math.sin(progress * Math.PI) * 0.3); // Slight upward curve
        const thickness = (0.18 - progress * 0.05) * scale; // Taper slightly

        parts.push({
            type: 'cylinder',
            position: new Vector3(x, y, position.z),
            radius: thickness,
            height: segmentLength,
            color: 0x8B6F47, // Light brown
            rotation: new Vector3(0, 0, Math.sin(progress * Math.PI) * 0.1) // Slight curve
        });
    }

    // Small leaves along the top of the branch
    const leafCount = 6;
    for (let i = 0; i < leafCount; i++) {
        const progress = (i + 1) / (leafCount + 1);
        const x = position.x + (progress * trunkLength);
        const y = position.y + (Math.sin(progress * Math.PI) * 0.3) + 0.25; // Above branch
        const zOffset = (i % 2 === 0 ? 0.15 : -0.15);

        parts.push({
            type: 'leaf',
            position: new Vector3(x, y, position.z + zOffset),
            size: {
                width: 0.25 * scale,
                height: 0.15 * scale
            },
            rotation: new Vector3(0, i * 0.4, Math.random() * 0.3),
            color: i % 3 === 0 ? 0x66BB6A : 0x4CAF50 // Varying greens
        });
    }

    return {
        type: 'branch_model',
        parts,
        position,
        rotation
    };
}
