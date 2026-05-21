export const KIND_ENUM = 0;
export const KIND_STRUCT = 1;
export const KIND_MESSAGE = 2;

export const BUILTINS: Record<number, string> = {
  [-1]: "bool",
  [-2]: "byte",
  [-3]: "int",
  [-4]: "uint",
  [-5]: "float",
  [-6]: "string",
  [-7]: "int64",
  [-8]: "uint64",
};
