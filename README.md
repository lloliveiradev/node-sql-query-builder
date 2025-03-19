# node-sql-query-builder

[![TypeScript](https://img.shields.io/badge/TypeScript-5.1.6-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A dynamic, secure, and flexible SQL query builder for Node.js, written in TypeScript. This module helps generate clean and secure SQL queries, preventing SQL Injection and making dynamic query construction more reliable.

## ✨ Features

- 🔒 SQL Injection Protection
- 📝 Support for multiple databases (MySQL, PostgreSQL, SQLite, MSSQL)
- 🎯 Strong typing with TypeScript
- 🔄 Dynamic and flexible queries
- 🧪 Complete unit tests
- 📦 Zero external dependencies

## 🚀 Installation

```bash
npm install node-sql-query-builder
```

## 💡 Basic Usage

```typescript
import { buildSqlQuery, SqlQuery } from "node-sql-query-builder";

const query: SqlQuery = {
  distinct: false,
  tables: [{ name: "users" }],
  columns: [
    { tableAlias: "users", name: "id" },
    { tableAlias: "users", name: "name" },
  ],
  wheres: [
    {
      col: { tableAlias: "users", name: "status" },
      op: "=",
      vals: ["active"],
    },
  ],
  client: "mysql",
};

const sql = await buildSqlQuery(query);
// Result: SELECT users.id, users.name FROM users WHERE users.status = 'active'
```

## 🛠️ Features

### Basic Queries

- Simple SELECT
- DISTINCT
- Table and column aliases
- LIMIT and ORDER BY

### Joins

- INNER JOIN
- LEFT JOIN
- RIGHT JOIN
- FULL JOIN

### Aggregations

- COUNT
- SUM
- AVG
- MIN
- MAX

### Conditions

- Comparison operators (=, <, >, <=, >=, !=)
- LIKE and NOT LIKE
- IN and NOT IN
- BETWEEN and NOT BETWEEN
- IS NULL and IS NOT NULL

### Grouping

- GROUP BY
- HAVING

## 📚 Examples

### Join Query

```typescript
const query: SqlQuery = {
  tables: [
    { name: "users", alias: "u" },
    { name: "orders", alias: "o" },
  ],
  columns: [
    { tableAlias: "u", name: "name" },
    { tableAlias: "o", name: "total" },
  ],
  joins: [
    {
      table: "orders",
      type: "left",
      on: [
        {
          col: { tableAlias: "u", name: "id" },
          op: "=",
          vals: ["o.user_id"],
        },
      ],
    },
  ],
  client: "postgres",
};
```

### Aggregation Query

```typescript
const query: SqlQuery = {
  tables: [{ name: "orders" }],
  aggregate: {
    type: "SUM",
    col: { tableAlias: "orders", name: "total" },
  },
  groupBy: [{ tableAlias: "orders", name: "status" }],
  having: [
    {
      col: { tableAlias: "orders", name: "total" },
      op: ">",
      vals: [1000],
    },
  ],
  client: "mysql",
};
```

## 🔒 Security

- Automatic SQL Injection validation
- SELECT queries only
- Parameter and type validation
- Automatic value escaping

## 🤝 Contributing

Contributions are welcome! Please feel free to:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Leo Oliveira - Initial development

## 🙏 Acknowledgments

- TypeScript Team
- Node.js Community
