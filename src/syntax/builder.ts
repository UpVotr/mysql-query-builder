import { Keyword, isKeyword, keywords } from "./keywords";

export type QueryPart =
  | {
      type: "keyword";
      value: Keyword;
    }
  | {
      type: "lparen" | "rparen" | "semicolon" | "comma";
    }
  | {
      type: "columndef";
      name: string;
      valType: string;
      null: boolean;
      default: string | null;
    }
  | {
      type: "literalIdentifier" | "raw" | "literal" | "condition";
      value: string;
    };

export class Query {
  constructor(protected parts: QueryPart[] = []) {}

  push(...parts: (QueryPart | Keyword | string)[]): this {
    this.parts.push(
      ...parts.map(part =>
        typeof part === "string"
          ? isKeyword(part)
            ? ({
                type: "keyword",
                value: part
              } as QueryPart)
            : ({
                type: "raw",
                value: part
              } as QueryPart)
          : part
      )
    );
    return this;
  }

  build(): string {
    return this.parts
      .map(p => {
        switch (p.type) {
          case "keyword": {
            if (!(p.value.toUpperCase() in keywords)) throw new Error("Invalid keyword!");
            return p.value;
          }
          case "lparen": {
            return "(";
          }
          case "rparen": {
            return ")";
          }
          case "semicolon": {
            return ";";
          }
          case "comma": {
            return ",";
          }
          case "columndef": {
            return `\`${p.name}\` ${p.valType}${p.null ? "" : " NOT NULL"}${p.default ? ` DEFAULT ${p.default}` : ""}`;
          }
          case "raw":
          case "condition":
          case "literal": {
            return p.value;
          }
          case "literalIdentifier": {
            return `\`${p.value}\``;
          }
        }
      })
      .join(" ");
  }

  select(columns: string | string[]): this {
    this.push({
      type: "keyword",
      value: "SELECT"
    });
    if (typeof columns === "string") {
      this.push({
        type: "literal",
        value: columns
      });
    } else {
      columns.forEach(col =>
        this.push({
          type: "literal",
          value: col
        })
      );
    }
    return this;
  }

  from(tables: string | string[]): this {
    this.push({
      type: "keyword",
      value: "FROM"
    });

    if (typeof tables === "string") {
      this.push({
        type: "literal",
        value: tables
      });
    } else {
      tables.forEach(tbl => this.push({ type: "literalIdentifier", value: tbl }));
    }
    return this;
  }

  where(cond: string): this {
    this.push({ type: "keyword", value: "WHERE" });
    return this.push({ type: "condition", value: cond });
  }

  and(cond: string): this {
    this.push({ type: "keyword", value: "AND" });
    return this.push({ type: "condition", value: cond });
  }

  or(cond: string): this {
    this.push({ type: "keyword", value: "OR" });
    return this.push({ type: "condition", value: cond });
  }

  not(cond: string): this {
    this.push({ type: "keyword", value: "NOT" });
    return this.push({ type: "condition", value: cond });
  }

  is(val: string): this {
    this.push({ type: "keyword", value: "IS" });
    return this.push({ type: "literal", value: val });
  }

  isNot(val: string): this {
    this.push({ type: "keyword", value: "IS" }).push({ type: "keyword", value: "NOT" });
    return this.push({ type: "literal", value: val });
  }

  insertInto(table: string) {
    this.push({ type: "keyword", value: "INSERT" }).push({ type: "keyword", value: "INTO" });
    return this.push({ type: "literal", value: table });
  }

  create() {
    return this.push({ type: "keyword", value: "CREATE" });
  }

  use(db: string) {
    return this.push({ type: "keyword", value: "USE" });
  }
}
