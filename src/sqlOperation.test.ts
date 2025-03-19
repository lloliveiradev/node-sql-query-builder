import buildSqlQuery from './sqlOperation';
import { SqlQuery } from './types';

describe('SQL Query Builder', () => {
    // Basic test case
    const basicTest: SqlQuery = {
        distinct: false,
        tables: [{ name: 'users' }],
        client: 'mysql'
    };

    test('should build a basic SQL query', async () => {
        const result = await buildSqlQuery(basicTest);
        expect(result).toBe('SELECT * FROM users');
    });

    // Full test case
    const fullTest: Partial<SqlQuery> = {
        distinct: true,
        aggregate: {
            type: 'COUNT',
            col: {
                tableAlias: 'users',
                name: 'id'
            }
        },
        // ... rest of your fullTest object ...
    };

    test('should build a complex SQL query with all parameters', async () => {
        const result = await buildSqlQuery(fullTest as SqlQuery);
        expect(result).toMatch(/SELECT DISTINCT COUNT\(users\.id\)/);
        expect(result).toMatch(/FROM users AS u/);
        expect(result).toMatch(/LEFT JOIN orders/);
    });

    describe('Validation Tests', () => {
        test('should throw error when no tables are provided', async () => {
            const noTables: Partial<SqlQuery> = {
                distinct: false,
                client: 'mysql'
            };

            await expect(buildSqlQuery(noTables as SqlQuery))
                .rejects
                .toThrow('At least one table must be specified');
        });

        test('should throw error when using GROUP BY without aggregation', async () => {
            const invalidQuery: SqlQuery = {
                distinct: false,
                tables: [{ name: 'users' }],
                groupBy: [{ tableAlias: 'users', name: 'id' }],
                client: 'mysql'
            };

            await expect(buildSqlQuery(invalidQuery))
                .rejects
                .toThrow('GROUP BY requires an aggregation function');
        });

        test('should throw error when using HAVING without GROUP BY', async () => {
            const invalidQuery: SqlQuery = {
                distinct: false,
                tables: [{ name: 'users' }],
                having: [{
                    col: { tableAlias: 'users', name: 'id' },
                    op: '>',
                    vals: [5]
                }],
                client: 'mysql'
            };

            await expect(buildSqlQuery(invalidQuery))
                .rejects
                .toThrow('HAVING clause requires GROUP BY');
        });

        // Add more validation tests following the same pattern
    });

    describe('Database-specific Tests', () => {
        test('should handle MySQL-specific syntax', async () => {
            const mysqlQuery: SqlQuery = {
                distinct: false,
                tables: [{ name: 'users' }],
                limit: 10,
                orderBy: ['name ASC'],
                client: 'mysql'
            };

            const result = await buildSqlQuery(mysqlQuery);
            expect(result).toMatch(/LIMIT 10/);
        });

        test('should handle PostgreSQL-specific syntax', async () => {
            const postgresQuery: SqlQuery = {
                distinct: false,
                tables: [{ name: 'users' }],
                limit: 10,
                orderBy: ['name ASC'],
                client: 'postgres'
            };

            const result = await buildSqlQuery(postgresQuery);
            expect(result).toMatch(/LIMIT 10/);
        });
    });
});

// Test with all parameters
const fullTest: SqlQuery = {
    distinct: true,
    aggregate: {
        type: 'COUNT',
        col: {
            tableAlias: 'users',
            name: 'id'
        }
    },
    columns: [
        { tableAlias: 'users', name: 'name', alias: 'user_name' },
        { tableAlias: 'users', name: 'email' }
    ],
    tables: [
        { name: 'users', alias: 'u' },
        { name: 'orders', alias: 'o' }
    ],
    joins: [
        {
            table: 'orders',
            type: 'left',
            on: [
                {
                    col: { tableAlias: 'u', name: 'id' },
                    op: '=',
                    vals: ['o.user_id']
                }
            ]
        }
    ],
    wheres: [
        {
            col: { tableAlias: 'u', name: 'status' },
            op: '=',
            vals: ['active']
        }
    ],
    groupBy: [
        { tableAlias: 'u', name: 'id' }
    ],
    having: [
        {
            col: { tableAlias: 'u', name: 'id' },
            op: '>',
            vals: [5]
        }
    ],
    orderBy: ['u.name ASC'],
    limit: 10,
    client: 'postgres'
};

// Validation tests
const validationTests: Record<string, Partial<SqlQuery>> = {
    // Test without tables (should throw error)
    noTables: {
        distinct: false,
        client: 'mysql'
    },

    // Test with GROUP BY without aggregation (should throw error)
    groupByWithoutAggregate: {
        distinct: false,
        tables: [{ name: 'users' }],
        groupBy: [{ tableAlias: 'users', name: 'id' }],
        client: 'mysql'
    },

    // Test with HAVING without GROUP BY (should throw error)
    havingWithoutGroupBy: {
        distinct: false,
        tables: [{ name: 'users' }],
        having: [
            {
                col: { tableAlias: 'users', name: 'id' },
                op: '>',
                vals: [5]
            }
        ],
        client: 'mysql'
    },

    // Test with duplicate aliases (should throw error)
    duplicateAliases: {
        distinct: false,
        tables: [{ name: 'users' }],
        columns: [
            { tableAlias: 'users', name: 'name', alias: 'same_alias' },
            { tableAlias: 'users', name: 'email', alias: 'same_alias' }
        ],
        client: 'mysql'
    },

    // Test with invalid table alias (should throw error)
    invalidTableAlias: {
        distinct: false,
        tables: [{ name: 'users' }],
        columns: [
            { tableAlias: 'invalid_table', name: 'name' }
        ],
        client: 'mysql'
    },

    // Test with SQLite HAVING (should throw error)
    sqliteWithHaving: {
        distinct: false,
        tables: [{ name: 'users' }],
        having: [
            {
                col: { tableAlias: 'users', name: 'id' },
                op: '>',
                vals: [5]
            }
        ],
        client: 'sqlite'
    },

    // Test with MSSQL DISTINCT and ORDER BY (should throw error)
    mssqlDistinctWithOrderBy: {
        distinct: true,
        tables: [{ name: 'users' }],
        orderBy: ['users.name ASC'],
        client: 'mssql'
    },

    // Test with LIMIT without ORDER BY (should throw error)
    limitWithoutOrderBy: {
        distinct: false,
        tables: [{ name: 'users' }],
        limit: 10,
        client: 'postgres'
    },

    // Test with MySQL unaggregated columns (should throw error)
    mysqlUnaggregatedColumns: {
        distinct: false,
        tables: [{ name: 'users' }],
        columns: [
            { tableAlias: 'users', name: 'name' },
            { tableAlias: 'users', name: 'email' }
        ],
        groupBy: [{ tableAlias: 'users', name: 'id' }],
        client: 'mysql'
    },

    // Test with JOIN without condition (should throw error)
    joinWithoutCondition: {
        distinct: false,
        tables: [{ name: 'users' }],
        joins: [
            {
                table: 'orders',
                type: 'left',
                on: []
            }
        ],
        client: 'mysql'
    }
};