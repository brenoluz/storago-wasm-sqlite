
import { ModelInterface, Schema, debug, Adapter, Field, FieldKind, codeFieldError, Model, Replace } from "@storago/orm";
import { SqliteWasmSelect } from "./select";
import { SqliteWasmInsert } from "./insert";
import { SqliteWasmCreate } from "./create";
import { SqliteWasmDrop } from "./drop";
import { SqliteWasmReplace } from "./replace";
import {default as sqlite3InitModule} from './sqlite3.mjs';

let sqlite3: any;

export enum codeSqliteWasmAdapterError {
  'DatabaseNotConnected' = '@storago/sqlite/adapter/DatabaseNotConnected',
}

export class SqliteWasmAdapter implements Adapter {

  protected db?: any;
  protected readonly path: string;

  constructor(path: string) {

    this.path = path;
  }

  public getDb(): any {
    return this.db;
  }

  public async connect(): Promise<void> {

    if (this.db !== undefined) {
      return;
    }

    if(!sqlite3){
      sqlite3 = await sqlite3InitModule();
    }

    sqlite3.wasm.sqlite3_wasm_vfs_unlink(0, this.path);
    this.db = new sqlite3.oo1.DB(this.path, 'ct');
  }

  public async prepare(sql: string, params: any[]): Promise<any> {

    return new Promise((resolve, reject) => {
      if (this.db === undefined) {
        reject({ code: codeSqliteWasmAdapterError.DatabaseNotConnected, message: 'database not connected, please call connect() first' });
      }

      let state = this.db.prepare(sql, params, (err: Error | null) => {
        if (err) {
          reject(err);
        } else {
          resolve(state);
        }
      })
    })
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db?.close((err: Error) => {
        if (err) {
          reject(err);
        } else {
          this.db = undefined;
          resolve();
        }
      })
    })
  }

  public run(sql: string, params: any[]): Promise<void> {

    return this.prepare(sql, params).then((statement) => {
      return new Promise((resolve, reject) => {
        statement.run((err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        })
      })
    })
  }

  public async get(sql: string, params: any[]): Promise<any | undefined> {

    return this.prepare(sql, params).then((statement) => {
      return new Promise((resolve, reject) => {
        statement.get((err: Error | null, row?: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        })
      })
    })
  }

  public all(sql: any, params: any[], ...args: any[]): Promise<any[] | undefined> {

    return this.prepare(sql, params).then((statement) => {
      return new Promise((resolve, reject) => {
        statement.all((err: Error | null, rows?: any[]) => {
          if (err) {
            reject(err);
          } else {
            statement.finalize((err: Error) => {
              if (err) {
                reject(err);
              } else {
                resolve(rows);
              }
            })
          }
        })
      })
    })
  }

  public each(sql: string, params: any[], callback: (err: Error | null, row: any) => void): Promise<Number | undefined> {

    return this.prepare(sql, params).then((statement: any) => {
      return new Promise((resolve, reject) => {
        statement.each(callback, (err: Error | null, count: Number) => {
          if (err) {
            reject(err);
          } else {
            resolve(count);
          }
        })
      })
    })
  }

  /*
  public getVersion(): '' | number {

    let version = this.db.version as string;
    if (version !== '') {
      return parseInt(version);
    }

    return '';
  }

  public changeVersion(newVersion: number, cb: callbackMigration): Promise<void> {

    return new Promise((resolve, reject) => {

      this.db.changeVersion(String(this.getVersion()), String(newVersion), cb, reject, resolve);
    });
  }
  

  public async getTransaction(): Promise<SQLTransaction> {

    return new Promise((resolve, reject) => {
      this.db.transaction(resolve, reject);
    });
  }
  */

  fieldTransformFromDb<F extends Field>(field: F, value: any): any {

    if (value === null) {
      return undefined;
    }

    if (field.kind == FieldKind.BOOLEAN) {
      if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      }

      return value;
    }

    if (field.kind == FieldKind.JSON) {
      return JSON.parse(value);
    }

    if (field.kind == FieldKind.INTEGER) {
      return parseInt(value);
    }

    if ([FieldKind.DATE, FieldKind.DATETIME].indexOf(field.kind) >= 0) {
      return new Date(value);
    }

    return value;
  }

  fieldTransformToDB<F extends Field>(field: F, value: any): any {

    if (value === undefined) {
      return null;
    }

    if (field.kind == FieldKind.BOOLEAN) {
      if (value === true) {
        value = 1;
      } else if (value === false) {
        value = 0;
      }

      return value;
    }

    if (field.kind == FieldKind.JSON) {
      return JSON.stringify(value);
    }

    if ([
      FieldKind.INTEGER,
      FieldKind.BOOLEAN,
      FieldKind.TINYINT,
      FieldKind.SMALLINT,
      FieldKind.MEDIUMINT,
      FieldKind.BIGINT,
    ].indexOf(field.kind) >= 0) {
      return parseInt(value);
    }

    if ([
      FieldKind.REAL,
      FieldKind.DOUBLE,
      FieldKind.FLOAT,
    ].indexOf(field.kind) >= 0) {
      return parseFloat(value);
    }

    if ([FieldKind.DATE, FieldKind.DATETIME].indexOf(field.kind) >= 0) {
      return value.getTime();
    }

    return value;
  };

  fieldCast<F extends Field>(field: F): string {

    if ([
      FieldKind.TEXT,
      FieldKind.VARCHAR,
      FieldKind.CHARACTER,
      FieldKind.JSON,
      FieldKind.UUID].indexOf(field.kind) >= 0) {
      return 'TEXT';
    }

    if ([
      FieldKind.NUMERIC,
      FieldKind.DATETIME,
      FieldKind.DATE,
      FieldKind.DECIMAL].indexOf(field.kind) >= 0) {
      return 'NUMERIC';
    }

    if ([
      FieldKind.INTEGER,
      FieldKind.BOOLEAN,
      FieldKind.TINYINT,
      FieldKind.SMALLINT,
      FieldKind.MEDIUMINT,
      FieldKind.BIGINT,
    ].indexOf(field.kind) >= 0) {
      return 'INTEGER';
    }

    if ([
      FieldKind.REAL,
      FieldKind.DOUBLE,
      FieldKind.FLOAT,
    ].indexOf(field.kind) >= 0) {
      return 'REAL';
    }

    if ([
      FieldKind.BLOB,
    ].indexOf(field.kind) >= 0) {
      return 'BLOB';
    }

    throw { code: codeFieldError.FieldKindNotSupported, message: `FieldKind: ${field.kind}` };
  };

  public select<M extends Model>(schema: Schema<SqliteWasmAdapter, M>): SqliteWasmSelect<M> {
    const select = new SqliteWasmSelect<M>(schema);
    return select;
  }

  public insert<M extends Model>(schema: Schema<SqliteWasmAdapter, M>): SqliteWasmInsert<M> {
    const insert = new SqliteWasmInsert<M>(schema);
    return insert;
  }

  public create<M extends Model>(schema: Schema<SqliteWasmAdapter, M>): SqliteWasmCreate<M> {
    const create = new SqliteWasmCreate<M>(schema);
    return create;
  }

  public drop<M extends Model>(schema: Schema<SqliteWasmAdapter, M>): SqliteWasmDrop<M> {
    const drop = new SqliteWasmDrop(schema);
    return drop;
  }

  public replace<M extends Model>(schema: Schema<this, M>): SqliteWasmReplace<M> {
    const replace = new SqliteWasmReplace(schema);
    return replace;
  }
}