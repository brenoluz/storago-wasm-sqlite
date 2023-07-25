import { Model, Schema, debug, Replace } from "@storago/orm";
import { SqliteWasmAdapter } from "./adapter";

export type dbValueCast = string | number;

export class SqliteWasmReplace<M extends Model> implements Replace<M>  {

  protected readonly schema: Schema<SqliteWasmAdapter, M>;
  protected readonly adapter: SqliteWasmAdapter;
  protected values: dbValueCast[] = [];
  protected objects: M[] = [];

  constructor(schema: Schema<SqliteWasmAdapter, M>) {
    this.schema = schema;
    this.adapter = this.schema.getAdapter();
  }

  add(row: M): void {

    this.objects.push(row);
  }

  getValues() : dbValueCast[] {
    return this.values;
  }

  render(): string {

    this.values = [];
    let fields = this.schema.getFields();

    let length = fields.length - 1;
    let sql = `REPLACE INTO ${ this.schema.getName() } (`;
    for (let i in fields) {

      let index = parseInt(i);
      let field = fields[i];
      let name = field.getName();
      sql += `${ name }`;
      if (index < length) {
        sql += ', ';
      }
    }

    sql += ') VALUES';

    let o_size = this.objects.length - 1;
    for (let o in this.objects) {

      let o_index = parseInt(o);
      let obj = this.objects[o];

      sql += ' (';

      for (let i in fields) {

        let index = parseInt(i);
        let field = fields[i];
        this.values.push(field.toDB<SqliteWasmAdapter, M>(this.adapter, obj)); //guarda os valores para gravar no banco

        sql += '?';
        if (index < length) {
          sql += ', ';
        }
      }

      sql += ')';

      if (o_index < o_size) {
        sql += ', ';
      }
    }

    sql += ';';
    return sql;
  }

  public async execute(): Promise<void> {

    let sql = this.render();
    if (debug.insert) {
      console.log(sql, this.values);
    }

    return this.adapter.run(sql, this.values);
    //return this.adapter.query(sql, this.values);
  }

  public async save(): Promise<void> {

    let result = await this.execute();
    console.log('result replace', result);
  }
}