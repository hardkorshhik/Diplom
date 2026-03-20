import { getTokenFromCookies } from "../Cookie";
import { api } from "./index";

export type BatchStatus = "OK" | "WARNING" | "FAIL";

export type ProductDto = {
    id: number;
    name: string;
    code: string;
};

export type MetricDto = {
    id: number;
    name: string;
    unit: string;
};

export type NormDto = {
    id: number;
    productId: number;
    metricId: number;
    minValue: number | null;
    maxValue: number | null;
};

export type BatchDto = {
    id: number;
    productId: number;
    batchNumber: string;
    createdAt: string;
    comment: string | null;
    status: BatchStatus;
};

export type MeasurementDto = {
    id: number;
    batchId: number;
    metricId: number;
    value: number;
    measuredAt: string;
    createdByUserId: number;
};

export type MetricStatsDto = {
    metricId: number;
    count: number;
    avg: number;
    min: number;
    max: number;
    outOfSpecCount: number;
};

export type BatchAnalysisDto = {
    status: BatchStatus;
    outOfSpecPercent: number;
    stats: MetricStatsDto[];
};

export type ImportRowErrorDto = {
    row: number;
    message: string;
};

export type MeasurementsImportResponse = {
    totalRows: number;
    importedRows: number;
    skippedRows: number;
    errors: ImportRowErrorDto[];
    analysis: BatchAnalysisDto;
};

type RequestInitExt = RequestInit & { auth?: boolean };

const buildHeaders = (initHeaders?: HeadersInit, auth = true): Headers => {
    const headers = new Headers(initHeaders || {});
    if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    if (auth) {
        const token = getTokenFromCookies();
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
    }
    return headers;
};

const requestJson = async <T>(path: string, init?: RequestInitExt): Promise<T> => {
    const auth = init?.auth !== false;
    const method = init?.method ?? "GET";

    const headers = buildHeaders(init?.headers, auth);
    const response = await fetch(`${api.host}${path}`, {
        ...init,
        method,
        headers,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
};

export const getProducts = async (): Promise<ProductDto[]> =>
    requestJson<ProductDto[]>("/api/products");

export const getMetrics = async (): Promise<MetricDto[]> =>
    requestJson<MetricDto[]>("/api/metrics");

export const getNormsByProduct = async (productId: number): Promise<NormDto[]> =>
    requestJson<NormDto[]>(`/api/norms/by-product/${productId}`);

export const getBatches = async (): Promise<BatchDto[]> =>
    requestJson<BatchDto[]>("/api/batches");

export const getBatch = async (batchId: number): Promise<BatchDto> =>
    requestJson<BatchDto>(`/api/batches/${batchId}`);

export const createBatch = async (payload: {
    productId: number;
    batchNumber: string;
    comment?: string;
}): Promise<BatchDto> =>
    requestJson<BatchDto>("/api/batches", {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const getBatchMeasurements = async (batchId: number): Promise<MeasurementDto[]> =>
    requestJson<MeasurementDto[]>(`/api/batches/${batchId}/measurements`);

export const getBatchAnalysis = async (batchId: number): Promise<BatchAnalysisDto> =>
    requestJson<BatchAnalysisDto>(`/api/batches/${batchId}/analysis`);

export const addMeasurement = async (
    batchId: number,
    payload: { metricId: number; value: number; measuredAt?: string }
): Promise<MeasurementDto> =>
    requestJson<MeasurementDto>(`/api/batches/${batchId}/measurements`, {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const importMeasurements = async (
    batchId: number,
    file: File
): Promise<MeasurementsImportResponse> => {
    const token = getTokenFromCookies();
    const form = new FormData();
    form.append("file", file);

    const headers = new Headers();
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${api.host}/api/batches/${batchId}/measurements/import`, {
        method: "POST",
        headers,
        body: form,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `${response.status} ${response.statusText}`);
    }

    return (await response.json()) as MeasurementsImportResponse;
};
