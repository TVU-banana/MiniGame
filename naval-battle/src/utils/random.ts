export function weightedPick<T>(items: T[], getWeight: (item: T) => number) {
  const total = items.reduce((sum, item) => sum + getWeight(item), 0);
  let threshold = Math.random() * total;

  for (const item of items) {
    threshold -= getWeight(item);
    if (threshold <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}
