"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LevelGenerator = void 0;
const LevelConfig_1 = require("./LevelConfig");
const random_1 = require("../utils/random");
function cellKey(x, y, z) {
    return `${x}:${y}:${z}`;
}
function parseCellKey(key) {
    const [x, y, z] = key.split(':').map(Number);
    return { x, y, z };
}
function normalize(coord, size) {
    if (size <= 1) {
        return 0;
    }
    const center = (size - 1) / 2;
    return (coord - center) / Math.max(1, center);
}
class LevelGenerator {
    generate(levelId, dimensions) {
        const spec = LevelConfig_1.LEVEL_SPECS[levelId];
        const occupiedCells = this.selectOccupiedCells(dimensions, spec.shape, spec.occupiedCells);
        return this.partitionOccupiedCells(occupiedCells, spec.targetBlocks);
    }
    selectOccupiedCells(dimensions, shape, targetOccupiedCells) {
        const groups = new Map();
        for (let y = 0; y < dimensions.sizeY; y += 1) {
            for (let z = 0; z < dimensions.sizeZ; z += 1) {
                for (let x = 0; x < dimensions.sizeX; x += 1) {
                    const key = cellKey(x, y, z);
                    const mirrorKey = cellKey(dimensions.sizeX - 1 - x, dimensions.sizeY - 1 - y, dimensions.sizeZ - 1 - z);
                    const groupKey = key < mirrorKey ? `${key}|${mirrorKey}` : `${mirrorKey}|${key}`;
                    if (groups.has(groupKey)) {
                        continue;
                    }
                    const cells = key === mirrorKey ? [key] : [key, mirrorKey];
                    const score = cells.reduce((sum, cell) => {
                        const { x: cx, y: cy, z: cz } = parseCellKey(cell);
                        return sum + this.scoreCell(dimensions, shape, cx, cy, cz);
                    }, 0) / cells.length;
                    groups.set(groupKey, { keys: cells, score });
                }
            }
        }
        const sortedGroups = [...groups.values()].sort((left, right) => right.score - left.score);
        const selected = [];
        for (const group of sortedGroups) {
            if (selected.length >= targetOccupiedCells) {
                break;
            }
            if (selected.length + group.keys.length > targetOccupiedCells) {
                continue;
            }
            selected.push(...group.keys);
        }
        return selected.map((key) => parseCellKey(key));
    }
    scoreCell(dimensions, shape, x, y, z) {
        const nx = normalize(x, dimensions.sizeX);
        const ny = normalize(y, dimensions.sizeY);
        const nz = normalize(z, dimensions.sizeZ);
        switch (shape) {
            case 'cube':
                return 1.4 - Math.max(Math.abs(nx) * 0.95, Math.abs(ny), Math.abs(nz) * 0.95);
            case 'sphere':
                return 1.6 - (nx * nx * 0.92 + ny * ny * 1.08 + nz * nz * 0.92);
            case 'diamond':
                return 1.55 - (Math.abs(nx) * 0.95 + Math.abs(ny) * 1.05 + Math.abs(nz) * 0.95);
            case 'heart': {
                const hx = nx / 1.05;
                const hz = (nz + 0.16) / 1.18;
                const heartField = Math.pow(hx * hx + hz * hz - 1, 3) - hx * hx * Math.pow(hz, 3);
                return 1.9 - heartField * 2.1 - Math.abs(ny) * 0.92;
            }
        }
    }
    partitionOccupiedCells(occupiedCells, targetBlocks) {
        let bestBlocks = this.buildSingles(occupiedCells);
        let bestDelta = Math.abs(bestBlocks.length - targetBlocks);
        for (let attempt = 0; attempt < 36; attempt += 1) {
            const nextBlocks = this.buildBlocksAttempt(occupiedCells, targetBlocks);
            const delta = Math.abs(nextBlocks.length - targetBlocks);
            if (delta < bestDelta) {
                bestDelta = delta;
                bestBlocks = nextBlocks;
            }
            if (delta === 0) {
                return nextBlocks;
            }
        }
        return bestBlocks;
    }
    buildBlocksAttempt(occupiedCells, targetBlocks) {
        const allKeys = new Set(occupiedCells.map((cell) => cellKey(cell.x, cell.y, cell.z)));
        const available = new Set(allKeys);
        const mergedBlocks = [];
        let mergesNeeded = Math.max(0, occupiedCells.length - targetBlocks);
        const claimedTriple = () => {
            if (mergesNeeded < 2) {
                return false;
            }
            for (const cell of (0, random_1.shuffle)([...available].map((key) => parseCellKey(key)))) {
                for (const axis of (0, random_1.shuffle)(['x', 'y', 'z'])) {
                    const keys = this.getLineKeys(cell, axis, 3);
                    if (keys.every((key) => available.has(key))) {
                        keys.forEach((key) => available.delete(key));
                        mergedBlocks.push(this.lineKeysToBlock(keys));
                        mergesNeeded -= 2;
                        return true;
                    }
                }
            }
            return false;
        };
        const claimedPair = () => {
            if (mergesNeeded < 1) {
                return false;
            }
            for (const cell of (0, random_1.shuffle)([...available].map((key) => parseCellKey(key)))) {
                for (const axis of (0, random_1.shuffle)(['x', 'y', 'z'])) {
                    const keys = this.getLineKeys(cell, axis, 2);
                    if (keys.every((key) => available.has(key))) {
                        keys.forEach((key) => available.delete(key));
                        mergedBlocks.push(this.lineKeysToBlock(keys));
                        mergesNeeded -= 1;
                        return true;
                    }
                }
            }
            return false;
        };
        while (mergesNeeded > 0) {
            const progressed = claimedPair() || claimedTriple();
            if (!progressed) {
                break;
            }
        }
        const singles = [...available].map((key) => {
            const cell = parseCellKey(key);
            return {
                x: cell.x,
                y: cell.y,
                z: cell.z,
                sizeX: 1,
                sizeY: 1,
                sizeZ: 1,
            };
        });
        const blocks = [...mergedBlocks, ...singles].sort((left, right) => left.y - right.y || left.z - right.z || left.x - right.x);
        return blocks.map((block, index) => ({
            id: `block-${index + 1}`,
            x: block.x,
            y: block.y,
            z: block.z,
            sizeX: block.sizeX,
            sizeY: block.sizeY,
            sizeZ: block.sizeZ,
            direction: '+X',
            removed: false,
        }));
    }
    buildSingles(occupiedCells) {
        return occupiedCells
            .slice()
            .sort((left, right) => left.y - right.y || left.z - right.z || left.x - right.x)
            .map((cell, index) => ({
            id: `block-${index + 1}`,
            x: cell.x,
            y: cell.y,
            z: cell.z,
            sizeX: 1,
            sizeY: 1,
            sizeZ: 1,
            direction: '+X',
            removed: false,
        }));
    }
    getLineKeys(origin, axis, length) {
        return Array.from({ length }, (_, index) => axis === 'x'
            ? cellKey(origin.x + index, origin.y, origin.z)
            : axis === 'y'
                ? cellKey(origin.x, origin.y + index, origin.z)
                : cellKey(origin.x, origin.y, origin.z + index));
    }
    lineKeysToBlock(keys) {
        const cells = keys.map((key) => parseCellKey(key));
        const xs = cells.map((cell) => cell.x);
        const ys = cells.map((cell) => cell.y);
        const zs = cells.map((cell) => cell.z);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const minZ = Math.min(...zs);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        const maxZ = Math.max(...zs);
        return {
            x: minX,
            y: minY,
            z: minZ,
            sizeX: maxX - minX + 1,
            sizeY: maxY - minY + 1,
            sizeZ: maxZ - minZ + 1,
        };
    }
}
exports.LevelGenerator = LevelGenerator;
