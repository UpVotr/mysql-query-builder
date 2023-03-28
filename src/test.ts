import { Database } from "./structures/database";
import { Table } from "./structures/table";

const table = new Table(
  "tableName",
  [
    {
      name: "columnA",
      type: "TINYINT UNSIGNED",
      notNull: true,
      default: "5"
    },
    {
      name: "columnB",
      type: "TIMESTAMP"
    },
    {
      name: "columnC",
      type: "ENUM('a', 'b')",
      notNull: true
    },
    {
      name: "columnD",
      type: "MEDIUMBLOB"
    }
  ] as const,
  "tbl"
);

const db = new Database("test", [table] as const);
console.log(db.create(true));
console.log(db.use());
console.log(db.ensureTable("tableName"));
console.log(db.ensureTables(["tableName"]));
console.log(db.drop(true));

console.log(table.create(true));

type RowType = Table.RowType<typeof table>;
