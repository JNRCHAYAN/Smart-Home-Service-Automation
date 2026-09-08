// Tiny classnames helper: joins truthy values with a space, so conditional
// classes can be passed inline without a dependency.
export function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}
