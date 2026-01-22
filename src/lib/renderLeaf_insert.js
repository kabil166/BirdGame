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
