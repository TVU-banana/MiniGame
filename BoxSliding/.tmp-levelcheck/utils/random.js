"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomInt = randomInt;
exports.randomItem = randomItem;
exports.shuffle = shuffle;
function randomInt(max) {
    return Math.floor(Math.random() * max);
}
function randomItem(items) {
    return items[randomInt(items.length)];
}
function shuffle(items) {
    const next = [...items];
    for (let index = next.length - 1; index > 0; index -= 1) {
        const swapIndex = randomInt(index + 1);
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    }
    return next;
}
