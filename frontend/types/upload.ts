export interface UploadResponse {
    uploadId: string;
    message?: string;
    status?: string;
}

export interface Upload {
    id: string;
    filename: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    uploadedAt: string;
    processedAt?: string;
    error?: string;
}
