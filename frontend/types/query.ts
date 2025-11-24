export interface QueryResult {
    sql: string;
    rows: Record<string, unknown>[];
    response?: string;
}

export interface QueryRequest {
    prompt: string;
}
