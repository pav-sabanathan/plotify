/** Strip leading articles for alphabetical sorting */
export function sortKey(name: string): string {
  return name.replace(/^(the|a|an)\s+/i, '').toLowerCase();
}

export function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name)));
}
