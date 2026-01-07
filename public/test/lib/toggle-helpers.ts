export const TOGGLE_HELPERS = {
  createToggler: <T,>(item: T, collection: T[]) => {
    const newCollection = collection.includes(item) ? collection.filter((x) => x !== item) : [...collection, item]
    return newCollection.length > 0 ? newCollection : collection
  },

  createSetToggler: <T,>(item: T, set: Set<T>) => {
    const newSet = new Set(set)
    if (newSet.has(item)) {
      newSet.delete(item)
    } else {
      newSet.add(item)
    }
    return newSet.size > 0 ? newSet : set
  },

  selectAll: <T,>(items: T[]) => items,
  clearAll: <T,>() => [],
}
