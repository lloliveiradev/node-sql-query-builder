// Description: This file contains the implementation of a sql query builder
// Author: Leo Oliveira
// Last update: 18/03/2025
// Version: 1.0
// Dependencies: none

import { Column, SqlQuery } from "./types";

/**
 * Generates a SQL query based on the provided parameters such as columns, tables, joins, conditions, and ordering
 * @param {SqlQuery} params - The parameters to generate the SQL query
 * @returns {string} - The generated SQL query
 */
export default function buildSqlQuery(params: SqlQuery): Promise<string> {
    validations(params);

    const { distinct, aggregate, columns, tables, joins, wheres, groupBy, having, orderBy, limit, client = 'mssql' } = params;

    const tablesString = tables.map((tab) => typeof tab === 'string' ? tab : `${tab.name}${tab.alias ? ` AS ${tab.alias}` : ''}`).join(', ');
    const columnsString = columns?.map((col) => typeof col === 'string' ? col : `${col.name}${col.alias ? ` AS ${col.alias}` : ''}`).join(', ') || '';
    const joinsString = joins?.map(({ table, on, type }) => `${type.toUpperCase()} JOIN ${table} ON ${on.map(({ col, op, vals }) => `${columnString(col)} ${valuesString(op, vals)}`).join(' AND ')}`).join(' ') || '';
    const wheresString = wheres?.map(({ col, op, vals }) => `${columnString(col)} ${valuesString(op, vals)}`).join(' AND ') || '';
    const havingString = having?.map(({ col, op, vals }) => `${columnString(col)} ${valuesString(op, vals)}`).join(' AND ') || '';
    const groupByString = groupBy?.map((col) => columnString(col)).join(', ') || '';
    const orderByString = orderBy?.join(', ') || '';

    return new Promise((resolve, reject) => {
        try {
            const query = (
                `SELECT` +
                ` ${client === 'mssql' && limit ? `TOP ${limit}` : ''}` +
                ` ${distinct ? 'DISTINCT ' : ''}` +
                ` ${aggregate ? `${aggregate.type}(${columnString(aggregate.col)})` : ''}` +
                ` ${!aggregate?.type && columns?.length ? columnsString : '*'}` +
                ` FROM ${tablesString}` +
                ` ${joinsString ? ` ${joinsString}` : ''}` +
                ` ${wheresString ? `WHERE ${wheresString}` : ''}` +
                ` ${groupByString ? `GROUP BY ${groupByString}` : ''}` +
                ` ${havingString ? `HAVING ${havingString}` : ''}` +
                ` ${orderByString ? `ORDER BY ${orderByString}` : ''}` +
                ` ${client !== 'mssql' && limit ? `LIMIT ${limit}` : ''}`
            ).trim().replace(/\s+/g, ' ');


            const sqlInjectionPattern = /;|--|\/\*|\*\/|xp_|exec|execute|insert|update|delete|drop|alter|create|truncate/i;
            if (sqlInjectionPattern.test(query)) {
                reject(new Error('Possible SQL injection attempt detected. Only SELECT queries are allowed.'));
            }
            if (!query.trim().toUpperCase().startsWith('SELECT')) {
                reject(new Error('Only SELECT queries are allowed.'));
            }

            resolve(query);
        } catch (error: any) {
            console.error(error);
            reject(error.message);
        }
    });
}

/**
 * Helper function to validate the input parameters for the SQL query builder
 * @param {SqlQuery} params - The parameters to validate
 * @returns {string | void} - Returns a string if the parameters are invalid, otherwise returns void
 */
function validations(params: SqlQuery): string | void {
    const { distinct, aggregate, columns, tables, groupBy, having, client, joins, limit, orderBy, wheres } = params;

    if (!tables?.length) {
        throw new Error('At least one table is required');
    }

    if ((aggregate && !groupBy?.length) || (!aggregate && groupBy?.length)) {
        throw new Error('Group by is required when using aggregate');
    }

    if (having?.length && (!groupBy?.length || !aggregate)) {
        throw new Error('Group by and aggregate are required when using having');
    }

    if (columns?.length) {
        const aliases = columns.filter(col => typeof col !== 'string').map(col => col.alias).filter(alias => alias);
        if (new Set(aliases).size !== aliases.length) {
            throw new Error('Column aliases must be unique');
        }

        for (const column of columns) {
            if (typeof column === 'string') continue;
            const tableExists = tables.filter(table => typeof table !== 'string').some(table =>
                column.tableAlias === table.name || column.tableAlias === table.alias
            );
            if (!tableExists) {
                throw new Error(`Column '${column.name}' references invalid table alias '${column.tableAlias}'`);
            }
        }
    }

    if (client === 'sqlite') {
        if (having?.length)
            throw new Error('Having is not supported in sqlite');

        if (joins?.some(join => ['right', 'full'].includes(join.type.toLowerCase())))
            throw new Error('RIGHT and FULL JOINs are not supported in SQLite');
    }

    if (client === 'mssql') {
        if (distinct && orderBy?.length)
            throw new Error('Order by is not supported when using distinct in mssql');
    }

    if (['postgres', 'mssql'].includes(client)) {
        if (limit && !orderBy?.length)
            throw new Error('Order by is required when using limit');
    }

    if (['mysql', 'mssql'].includes(client)) {
        if (groupBy?.length && columns?.length) {
            const groupByColumns = new Set(groupBy.filter(col => typeof col !== 'string').map(col => col.name));
            const notMappedColumns = columns.filter(col => {
                if (typeof col === 'string') return false;
                return !groupByColumns.has(col.name) &&
                    !col.name.toUpperCase().match(/^(COUNT|SUM|AVG|MIN|MAX)\(/)
            });

            if (notMappedColumns.length > 0)
                throw new Error('Columns in SELECT must either be in GROUP BY or be aggregated');
        }
    }

    if (joins?.length) {
        for (const join of joins) {
            if (!join.on?.length) {
                throw new Error(`Join condition is required for table: ${join.table}`);
            }
        }
    }

    if (tables.length > 1) {
        if (!wheres?.length)
            throw new Error('Where is required when using multiple tables');
    }
}

/**
 * Generate a string to be used in a SQL query based on the operator and values
 * @param operator - The operator to be used in the SQL query
 * @param values - The values to be used in the SQL query
 * @returns {string} - The generated string
 */
function valuesString(operator: string, values: any[]): string {
    switch (operator) {
        case 'IN':
            return `${operator} (${values.map(value => typeof value === 'string' ? `'${value}'` : value).join(', ')})`;
        case 'NOT IN':
            return `${operator} (${values.map(value => typeof value === 'string' ? `'${value}'` : value).join(', ')})`;
        case 'BETWEEN':
            const [start, end] = values;
            return `${operator} (${typeof start === 'string' ? `'${start}'` : start} AND ${typeof end === 'string' ? `'${end}'` : end})`;
        case 'NOT BETWEEN':
            const [start2, end2] = values;
            return `${operator} (${typeof start2 === 'string' ? `'${start2}'` : start2} AND ${typeof end2 === 'string' ? `'${end2}'` : end2})`;
        case 'LIKE':
            return `${operator} '%${values[0]}%'`;
        case 'NOT LIKE':
            return `${operator} '%${values[0]}%'`;
        case 'IS NULL':
            return operator;
        case 'IS NOT NULL':
            return operator;
        default:
            return `${operator} ${typeof values === 'string' ? `'${values}'` : values}`;
    }
}

/**
 * Generate a string to be used in a SQL query based on the column
 * @param col - The column to be used in the SQL query
 * @returns {string} - The generated string
 */
function columnString(col: Column): string {
    return typeof col === 'string' ? col : `${col.tableAlias}.${col.name}`;
}