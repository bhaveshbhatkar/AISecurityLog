export interface Event {
    id: number;
    timestamp: string | null;
    src_ip?: string;
    dest_ip?: string;
    url?: string;
    method?: string;
    status?: number;
    user_agent?: string;
    username?: string;
    bytes?: number;
    anomalies?: Anomaly[];
    raw_line?: string;
    upload_id?: string;
}

export interface Anomaly {
    id: number;
    event_id: number;
    detector: string;
    score: number;
    reason: string;
}

export interface EventsResponse {
    events: Event[];
    total: number;
    page: number;
    perPage: number;
}

export interface AnomaliesResponse {
    anomalies: Anomaly[];
    total: number;
    page: number;
    perPage: number;
}
