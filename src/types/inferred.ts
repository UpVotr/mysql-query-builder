export type NumberConverted = `${"" | "TINY" | "SMALL" | "MEDIUM"}INT${` ${"UN" | ""}SIGNED` | ""}` | "YEAR" | "FLOAT" | "DOUBLE" | "BOOLEAN";

export type DateConverted = "TIMESTAMP" | "DATE" | "DATETIME";

export type BufferConverted = `${"" | "TINY" | "MEDIUM" | "LONG"}BLOB` | "BINARY" | "VARBINARY" | "BIT";

export type StringConverted =
  | `${"CHAR" | "VARCHAR"}(${number})`
  | `${"" | "TINY" | "MEDIUM" | "LONG"}TEXT`
  | `SET(${string})`
  | "DECIMAL"
  | "BIGINT"
  | "TIME"
  | "GEOMETRY";

type EnumValue<V extends string> = V extends `${`"${infer M}"` | `'${infer M}'`}, ${infer Rest}`
  ? M | EnumValue<Rest>
  : V extends `${`"${infer M}"` | `'${infer M}'`}`
  ? M
  : any;

export type EnumValues<D extends string> = D extends `ENUM(${infer V})` ? EnumValue<V> : never;

export type EnumConverted = `ENUM(${string})`;
