export function getAdjacentEntries(entries, currentPath) {
  const currentIndex = entries.findIndex((entry) => entry.path === currentPath);

  if (currentIndex === -1) {
    return {
      prevEntry: null,
      nextEntry: null,
    };
  }

  return {
    prevEntry: currentIndex > 0 ? entries[currentIndex - 1] : null,
    nextEntry: currentIndex < entries.length - 1 ? entries[currentIndex + 1] : null,
  };
}
