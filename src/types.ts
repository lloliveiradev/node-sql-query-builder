// Types and interfaces used in the implementation
export type comparisonOperator = '=' | '<' | '>' | '<=' | '>=' | '!=' | 'LIKE' | 'NOT LIKE' | 'IN' | 'NOT IN' | 'BETWEEN' | 'NOT BETWEEN' | 'IS NULL' | 'IS NOT NULL';
export interface Comparison {
    col: Column;
    vals: any[];
    op: comparisonOperator;
}

export type aggregateType = 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
export interface Aggregate {
    col: Column;
    type: aggregateType;
}

export type joinType = 'inner' | 'left' | 'right' | 'full';
export interface Join {
    table: string;
    on: Comparison[];
    type: joinType;
}

export type Table = string | {
    name: string;
    alias?: string;
};

export type Column = string | {
    tableAlias: string;
    name: string;
    alias?: string;
}

export type clientType = 'mysql' | 'postgres' | 'sqlite' | 'mssql';

export interface SqlQuery {
    distinct: boolean;
    aggregate?: Aggregate;
    columns?: Array<Column>;
    tables: Array<Table>;
    joins?: Array<Join>;
    wheres?: Array<Comparison>;
    groupBy?: Array<Column>;
    having?: Array<Comparison>;
    orderBy?: string[];
    limit?: number;
    client: clientType;
}