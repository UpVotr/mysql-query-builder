import { Query, QueryPart } from "../syntax/builder";
import { BufferConverted, DateConverted, EnumConverted, EnumValues, NumberConverted, StringConverted } from "../types/inferred";

export class Table<C extends readonly Table.ColumnDef[], N extends string> {
  constructor(private tableName: N, private columns: Table.UniqueColumnName<C>, private key: string = "", private alias?: string) {
    if ([...new Set(columns.map(col => col.name))].length !== columns.length) throw new Error("Cannot have two columns with the same name!");
  }

  rawName(): N {
    return this.tableName;
  }

  aliasedName() {
    return this.alias ? `\`${this.tableName}\` \`${this.alias}\`` : `\`${this.tableName}\``;
  }

  toString() {
    return this.aliasedName();
  }

  valueOf() {
    return this.aliasedName();
  }

  column(name: C[number]["name"]): string {
    return this.alias ? `\`${this.alias}\`.\`${name}\`` : `\`${name}\``;
  }

  create(ifNotExists: boolean) {
    return new Query([
      {
        type: "keyword",
        value: "CREATE"
      },
      {
        type: "keyword",
        value: "TABLE"
      },
      ...(ifNotExists
        ? ([
            {
              type: "keyword",
              value: "IF"
            },
            {
              type: "keyword",
              value: "NOT"
            },
            {
              type: "keyword",
              value: "EXISTS"
            }
          ] as const)
        : []),
      {
        type: "literalIdentifier",
        value: this.tableName
      },
      {
        type: "lparen"
      },
      ...this.columns.flatMap<QueryPart>((col, idx, arr) => [
        typeof col.raw === "string"
          ? {
              type: "raw",
              value: col.raw
            }
          : {
              type: "columndef",
              name: col.name,
              valType: col.type,
              null: col.notNull ?? true,
              default: col.default ?? null
            },
        ...(idx !== arr.length - 1 ? [{ type: "comma" as const }] : [])
      ]),
      {
        type: "rparen"
      },
      {
        type: "raw",
        value: this.key
      }
    ]).build();
  }

  drop(ifExists: boolean) {
    return new Query([
      {
        type: "keyword",
        value: "DROP"
      },
      {
        type: "keyword",
        value: "TABLE"
      },
      ...(ifExists
        ? ([
            {
              type: "keyword",
              value: "IF"
            },
            {
              type: "keyword",
              value: "EXISTS"
            }
          ] as const)
        : []),
      {
        type: "literalIdentifier",
        value: this.tableName
      }
    ]);
  }
}

export namespace Table {
  export interface ColumnDef {
    name: string;
    type: string;
    notNull?: boolean;
    default?: string;
    raw?: string;
  }

  type HasColumnWithName<T extends readonly ColumnDef[], N extends string> = T extends readonly [infer C extends ColumnDef, ...any[]]
    ? C["name"] extends N
      ? true
      : T extends readonly [infer C extends ColumnDef]
      ? C["name"] extends N
        ? true
        : T extends readonly [any, ...infer Rest extends readonly ColumnDef[]]
        ? HasColumnWithName<Rest, N>
        : false
      : false
    : false;

  export type UniqueColumnName<T extends readonly ColumnDef[]> = T extends readonly [infer C extends ColumnDef, ...infer Rest extends readonly ColumnDef[]]
    ? HasColumnWithName<Rest, C["name"]> extends true
      ? UniqueColumnName<Rest>
      : readonly [C, ...UniqueColumnName<Rest>]
    : T;

  type CType<T extends ColumnDef["type"]> = Uppercase<T> extends NumberConverted
    ? number
    : Uppercase<T> extends DateConverted
    ? Date
    : Uppercase<T> extends BufferConverted
    ? Buffer
    : Uppercase<T> extends StringConverted
    ? string
    : T extends EnumConverted
    ? EnumValues<T>
    : Uppercase<T> extends EnumConverted
    ? string
    : unknown;

  export type RowType<T extends Table<any, string>> = T extends Table<infer C, string>
    ? {
        [k in C[number] as k["notNull"] extends true ? k["name"] : never]: CType<k["type"]>;
      } & {
        [k in C[number] as k["notNull"] extends true ? never : k["name"]]?: CType<k["type"]>;
      }
    : never;
}
