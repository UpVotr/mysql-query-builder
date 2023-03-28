import { Query } from "../syntax/builder";
import { Table } from "./table";

export class Database<Tables extends readonly Table<any, string>[]> {
  constructor(private dbName: string, private tables: Database.UniqueTableName<Tables>) {
    if ([...new Set(tables.map(t => t.rawName()))].length !== tables.length) throw new Error("Cannot have two tables with the same name!");
  }

  create(ifNotExists: boolean) {
    return new Query([
      {
        type: "keyword",
        value: "CREATE"
      },
      {
        type: "keyword",
        value: "DATABASE"
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
        value: this.dbName
      }
    ]).build();
  }

  use() {
    return new Query([
      { type: "keyword", value: "USE" },
      { type: "literalIdentifier", value: this.dbName }
    ]).build();
  }

  drop(ifExists: boolean) {
    return new Query([
      { type: "keyword", value: "DROP" },
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
      { type: "literalIdentifier", value: this.dbName }
    ]).build();
  }

  ensureTable(table: Database.TableName<Tables>) {
    const t = this.tables.find(T => T.rawName() === table);
    if (!t) throw new Error(`No table with name \`${table}\``);

    return t.create(true);
  }

  ensureTables(tables: Database.TableName<Tables>[]) {
    return tables.map(t => this.ensureTable(t));
  }
}

export namespace Database {
  type HasTableWithName<T extends Table<any, string>[], N extends string> = T extends readonly [
    Table<any, infer TN>,
    ...infer Rest extends Table<any, string>[]
  ]
    ? TN extends N
      ? true
      : HasTableWithName<Rest, N>
    : T extends readonly [Table<any, infer TN>]
    ? TN extends N
      ? true
      : false
    : false;
  export type UniqueTableName<T extends readonly Table<any, string>[]> = T extends readonly [
    infer Tbl extends Table<any, infer N>,
    ...infer Rest extends Table<any, string>[]
  ]
    ? HasTableWithName<Rest, N> extends true
      ? UniqueTableName<Rest>
      : readonly [Tbl, ...UniqueTableName<Rest>]
    : T;

  export type TableName<T extends readonly Table<any, string>[]> = T extends readonly Table<any, infer N>[] ? N : string;
}
