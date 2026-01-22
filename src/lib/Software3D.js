/**
 * Software3D - Pure JavaScript 3D Math Library
 * No native dependencies, works on all platforms
 */

// Vector3 class for 3D positions/directions
export class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(v) {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    subtract(v) {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    multiply(scalar) {
        return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    normalize() {
        const len = this.length();
        if (len === 0) return new Vector3(0, 0, 0);
        return this.multiply(1 / len);
    }

    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    cross(v) {
        return new Vector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }
}

// Simple Camera for perspective projection
export class Camera {
    constructor(position = new Vector3(0, 0, 10), fov = 60) {
        this.position = position;
        this.fov = fov;
        this.near = 0.1;
        this.far = 1000;
    }

    // Project 3D point to 2D screen coordinates
    project(point, screenWidth, screenHeight) {
        // Translate to camera space
        const translated = point.subtract(this.position);

        // Avoid division by zero
        if (translated.z >= -0.1) {
            return null; // Behind camera
        }

        // Perspective projection
        const scale = 1 / Math.tan((this.fov * Math.PI) / 360);
        const aspectRatio = screenWidth / screenHeight;

        const x = (translated.x * scale / -translated.z) * (screenWidth / 2) + (screenWidth / 2);
        const y = (translated.y * scale / aspectRatio / -translated.z) * (screenHeight / 2) + (screenHeight / 2);

        return {
            x,
            y,
            depth: -translated.z, // For z-sorting
            scale: 1 / -translated.z // For size scaling
        };
    }
}

// Matrix operations (simplified for rotations)
export class Matrix4 {
    static rotationY(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return {
            apply: (v) => new Vector3(
                v.x * c - v.z * s,
                v.y,
                v.x * s + v.z * c
            )
        };
    }

    static rotationX(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return {
            apply: (v) => new Vector3(
                v.x,
                v.y * c - v.z * s,
                v.y * s + v.z * c
            )
        };
    }

    static rotationZ(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return {
            apply: (v) => new Vector3(
                v.x * c - v.y * s,
                v.x * s + v.y * c,
                v.z
            )
        };
    }
}

// Calculate lighting (simple directional light)
export function calculateLighting(normal, lightDirection, baseColor, ambientStrength = 0.3) {
    const normalized = normal.normalize();
    const lightDot = Math.max(0, normalized.dot(lightDirection.normalize()));

    const ambient = ambientStrength;
    const diffuse = lightDot * (1 - ambientStrength);
    const brightness = ambient + diffuse;

    // Apply brightness to color
    const r = Math.floor(((baseColor >> 16) & 0xFF) * brightness);
    const g = Math.floor(((baseColor >> 8) & 0xFF) * brightness);
    const b = Math.floor((baseColor & 0xFF) * brightness);

    return `rgb(${r}, ${g}, ${b})`;
}

// Convert hex color to components
export function hexToRgb(hex) {
    const r = (hex >> 16) & 0xFF;
    const g = (hex >> 8) & 0xFF;
    const b = hex & 0xFF;
    return { r, g, b };
}

// Simple sphere mesh (stored as circle with lighting)
export function createSphereMesh(position, radius, color) {
    return {
        type: 'sphere',
        position,
        radius,
        color,
        rotation: new Vector3(0, 0, 0)
    };
}

// Simple cylinder mesh (stored as segments)
export function createCylinderMesh(position, radius, height, color) {
    return {
        type: 'cylinder',
        position,
        radius,
        height,
        color,
        rotation: new Vector3(0, 0, 0)
    };
}
