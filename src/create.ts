import { ModelInterface, Schema, Create } from "@storago/orm";
import { SqliteWasmAdapter } from "./adapter"

export class SqliteWasmCreate<M extends ModelInterface> implements Create<M>{

  private schema: Schema<SqliteWasmAdapter, M>;
  private adapter: SqliteWasmAdapter;
 
  constructor(schema: Schema<SqliteWasmAdapter, M>){

    this.schema = schema;
    this.adapter = schema.getAdapter();
  }

  private getColumns() : string[] {

    const columns: string[] = [];
    let fields = this.schema.getFields();

    for(let field of fields){
      let name = field.getName();
      columns.push(`${name} ${field.castDB<SqliteWasmAdapter>(this.adapter)}`);
    }

    return columns;
  }

  public render() : string {

    let columns: string[] = this.getColumns();
    let sql = `CREATE TABLE IF NOT EXISTS ${this.schema.getName()} (`;
    sql += columns.join(', ');
    sql += ');';
    return sql;
  }

  public execute() : Promise<void> {

    let sql: string = this.render();
    return this.adapter.run(sql, []);
  }
}