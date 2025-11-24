'use client';

import useSWR from 'swr';
import api from '@/lib/api';
import EventsTable from '@/components/EventsTable';
import type { EventsResponse } from '@/types/event';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function EventsPage() {
    const { data, error } = useSWR<EventsResponse>('/events?page=1&perPage=50', fetcher);
    const events = data?.events || [];

    return (
        <div className="">
            <h3 className="text-2xl font-semibold mb-4">Events</h3>
            <EventsTable rows={events} />
        </div>
    );
}
