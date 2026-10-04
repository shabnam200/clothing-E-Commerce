// Tiny className joiner — avoids pulling in a dependency for simple conditionals.
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
