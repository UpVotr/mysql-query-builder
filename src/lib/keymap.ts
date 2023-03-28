export type KeyMap<T extends string> = {
  [k in T]: k;
};

export default function keymap<T extends string>(keys: T[]): KeyMap<T> {
  return Object.fromEntries(keys.map(k => [k, k])) as KeyMap<T>;
}
