import { DatabaseSync } from 'node:sqlite';

class D1StatementHarness {
  constructor(database, sql) {
    this.database = database;
    this.sql = String(sql).replace(/\?\d+/g, '?');
    this.values = [];
  }

  bind(...values) {
    const next = new D1StatementHarness(this.database, this.sql);
    next.values = values;
    return next;
  }

  first(column) {
    const row = this.database.prepare(this.sql).get(...this.values) || null;
    return column && row ? row[column] : row;
  }

  all() {
    return { success: true, results: this.database.prepare(this.sql).all(...this.values) };
  }

  run() {
    const result = this.database.prepare(this.sql).run(...this.values);
    return { success: true, meta: { changes: Number(result.changes || 0), last_row_id: Number(result.lastInsertRowid || 0) } };
  }
}

export class D1DatabaseHarness {
  constructor(migrationSql = '') {
    this.database = new DatabaseSync(':memory:');
    if (migrationSql) this.database.exec(migrationSql);
  }

  prepare(sql) {
    return new D1StatementHarness(this.database, sql);
  }

  batch(statements) {
    this.database.exec('BEGIN');
    try {
      const results = statements.map(statement => statement.run());
      this.database.exec('COMMIT');
      return results;
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  exec(sql) {
    this.database.exec(sql);
    return { count: 0, duration: 0 };
  }

  close() {
    this.database.close();
  }
}
