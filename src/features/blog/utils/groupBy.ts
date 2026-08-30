export function groupBy<T, K extends PropertyKey>(
  items: Iterable<T>,
  getKey: (item: T, index: number) => K
): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  let index = 0;

  for (const item of items) {
    const key = getKey(item, index);
    const group = groups.get(key);

    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }

    index += 1;
  }

  return groups;
}
