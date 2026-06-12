export function steadyTransform(transform: string): {
  transform: string;
  willChange: "transform";
} {
  return {
    transform: `perspective(100px) ${transform}`,
    willChange: "transform",
  };
}
