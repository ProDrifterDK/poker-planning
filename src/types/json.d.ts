declare module '*.json' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value: Record<string, unknown>;
  export default value;
}