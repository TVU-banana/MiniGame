"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEVEL_IDS = exports.CHALLENGE_TIME_LIMITS = exports.LEVEL_CONFIG = exports.LEVEL_SPECS = void 0;
exports.getNextLevel = getNextLevel;
exports.LEVEL_SPECS = {
    1: {
        dimensions: { sizeX: 3, sizeY: 4, sizeZ: 4 },
        challengeTimeMs: 60000,
        shape: 'cube',
        targetBlocks: 16,
        occupiedCells: 20,
    },
    2: {
        dimensions: { sizeX: 4, sizeY: 4, sizeZ: 4 },
        challengeTimeMs: 90000,
        shape: 'sphere',
        targetBlocks: 24,
        occupiedCells: 32,
    },
    3: {
        dimensions: { sizeX: 5, sizeY: 5, sizeZ: 4 },
        challengeTimeMs: 135000,
        shape: 'heart',
        targetBlocks: 36,
        occupiedCells: 48,
    },
    4: {
        dimensions: { sizeX: 6, sizeY: 6, sizeZ: 4 },
        challengeTimeMs: 210000,
        shape: 'diamond',
        targetBlocks: 54,
        occupiedCells: 72,
    },
    5: {
        dimensions: { sizeX: 6, sizeY: 7, sizeZ: 5 },
        challengeTimeMs: 315000,
        shape: 'sphere',
        targetBlocks: 81,
        occupiedCells: 108,
    },
    6: {
        dimensions: { sizeX: 7, sizeY: 8, sizeZ: 6 },
        challengeTimeMs: 480000,
        shape: 'heart',
        targetBlocks: 122,
        occupiedCells: 162,
    },
};
exports.LEVEL_CONFIG = {
    1: exports.LEVEL_SPECS[1].dimensions,
    2: exports.LEVEL_SPECS[2].dimensions,
    3: exports.LEVEL_SPECS[3].dimensions,
    4: exports.LEVEL_SPECS[4].dimensions,
    5: exports.LEVEL_SPECS[5].dimensions,
    6: exports.LEVEL_SPECS[6].dimensions,
};
exports.CHALLENGE_TIME_LIMITS = {
    1: exports.LEVEL_SPECS[1].challengeTimeMs,
    2: exports.LEVEL_SPECS[2].challengeTimeMs,
    3: exports.LEVEL_SPECS[3].challengeTimeMs,
    4: exports.LEVEL_SPECS[4].challengeTimeMs,
    5: exports.LEVEL_SPECS[5].challengeTimeMs,
    6: exports.LEVEL_SPECS[6].challengeTimeMs,
};
exports.LEVEL_IDS = [1, 2, 3, 4, 5, 6];
function getNextLevel(levelId) {
    const index = exports.LEVEL_IDS.indexOf(levelId);
    if (index === -1 || index === exports.LEVEL_IDS.length - 1) {
        return null;
    }
    return exports.LEVEL_IDS[index + 1];
}
