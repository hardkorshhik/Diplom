import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./batchDetails.css";
import {
    addMeasurement,
    deleteBatch,
    getBatch,
    getBatchAnalysis,
    getBatchMeasurements,
    getMetrics,
    getNormsByProduct,
    getProducts,
    importMeasurements,
    type BatchAnalysisDto,
    type BatchDto,
    type BatchStatus,
    type ImportRowErrorDto,
    type MeasurementDto,
    type MetricDto,
    type NormDto,
    type ProductDto,
} from "../../Api/LabApi";
import { getTokenFromCookies } from "../../Cookie";
import { parseJwt } from "../../Auth/Jwt";

const statusClass = (s: BatchStatus) => {
    if (s === "OK") return "status-pill status-ok";
    if (s === "WARNING") return "status-pill status-warn";
    return "status-pill status-fail";
};

export const BatchDetailsPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const batchId = Number(id);

    const token = getTokenFromCookies();
    const role = (token ? parseJwt(token)?.role : null) as string | null;
    const canDeleteBatch = role === "ADMIN";

    const [batch, setBatch] = useState<BatchDto | null>(null);
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [metrics, setMetrics] = useState<MetricDto[]>([]);
    const [norms, setNorms] = useState<NormDto[]>([]);
    const [measurements, setMeasurements] = useState<MeasurementDto[]>([]);
    const [analysis, setAnalysis] = useState<BatchAnalysisDto | null>(null);

    const [loading, setLoading] = useState(true);
    const [errorText, setErrorText] = useState<string | null>(null);

    const [addMetricId, setAddMetricId] = useState<number | null>(null);
    const [addValue, setAddValue] = useState("");
    const [addMeasuredAt, setAddMeasuredAt] = useState("");
    const [addBusy, setAddBusy] = useState(false);

    const [importFile, setImportFile] = useState<File | null>(null);
    const [importBusy, setImportBusy] = useState(false);
    const [importResultText, setImportResultText] = useState<string | null>(null);
    const [importErrors, setImportErrors] = useState<ImportRowErrorDto[]>([]);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
    const metricById = useMemo(() => new Map(metrics.map((m) => [m.id, m])), [metrics]);
    const normByMetricId = useMemo(() => new Map(norms.map((n) => [n.metricId, n])), [norms]);

    const measuredValuesByMetricId = useMemo(() => {
        const map = new Map<number, number[]>();
        for (const m of measurements) {
            const values = map.get(m.metricId);
            if (values) values.push(m.value);
            else map.set(m.metricId, [m.value]);
        }
        return map;
    }, [measurements]);

    const load = useCallback(async () => {
        if (!Number.isFinite(batchId) || batchId <= 0) {
            setErrorText("Некорректный ID партии");
            setLoading(false);
            return;
        }

        setLoading(true);
        setErrorText(null);
        try {
            const [batchData, productsData, metricsData, measurementsData, analysisData] = await Promise.all([
                getBatch(batchId),
                getProducts(),
                getMetrics(),
                getBatchMeasurements(batchId),
                getBatchAnalysis(batchId),
            ]);
            const normsData = await getNormsByProduct(batchData.productId);

            setBatch(batchData);
            setProducts(productsData);
            setMetrics(metricsData);
            setMeasurements(measurementsData);
            setAnalysis(analysisData);
            setNorms(normsData);
            setAddMetricId((prev) => prev ?? (metricsData[0]?.id ?? null));
        } catch (e: unknown) {
            setErrorText(e instanceof Error ? e.message : "Не удалось загрузить данные партии");
        } finally {
            setLoading(false);
        }
    }, [batchId]);

    useEffect(() => {
        void load();
    }, [load]);

    const onAddMeasurement = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!batch || !addMetricId) return;

            const parsed = Number(addValue.replace(",", "."));
            if (!Number.isFinite(parsed)) {
                setErrorText("Введите корректное числовое значение");
                return;
            }

            setAddBusy(true);
            setErrorText(null);
            try {
                const measuredAt = addMeasuredAt ? new Date(addMeasuredAt).toISOString() : undefined;
                await addMeasurement(batch.id, { metricId: addMetricId, value: parsed, measuredAt });
                setAddValue("");
                setAddMeasuredAt("");
                await load();
            } catch (e: unknown) {
                setErrorText(e instanceof Error ? e.message : "Не удалось добавить измерение");
            } finally {
                setAddBusy(false);
            }
        },
        [addMetricId, addMeasuredAt, addValue, batch, load]
    );

    const onImport = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!batch || !importFile) return;

            setImportBusy(true);
            setErrorText(null);
            setImportResultText(null);
            setImportErrors([]);
            try {
                const result = await importMeasurements(batch.id, importFile);
                setImportResultText(
                    `Импортировано: ${result.importedRows}/${result.totalRows}. ` +
                        `Пропущено: ${result.skippedRows}. Выход за допуск: ${result.analysis.outOfSpecPercent}%.`
                );
                setImportErrors(result.errors);
                await load();
            } catch (e: unknown) {
                setErrorText(e instanceof Error ? e.message : "Не удалось импортировать файл");
            } finally {
                setImportBusy(false);
            }
        },
        [batch, importFile, load]
    );

    const onDeleteBatch = useCallback(async () => {
        if (!batch) return;
        const ok = window.confirm(`Удалить партию "${batch.batchNumber}" вместе со всеми измерениями?`);
        if (!ok) return;

        setDeleteBusy(true);
        setErrorText(null);
        try {
            await deleteBatch(batch.id);
            navigate("/batches", { replace: true });
        } catch (e: unknown) {
            setErrorText(e instanceof Error ? e.message : "Не удалось удалить партию");
        } finally {
            setDeleteBusy(false);
        }
    }, [batch, navigate]);

    if (loading) {
        return (
            <div className="batch-page">
                <div className="batch-bg" />
                <div className="batch-noise" />
                <div className="batch-container">
                    <section className="card">Загрузка данных партии...</section>
                </div>
            </div>
        );
    }

    if (!batch) {
        return (
            <div className="batch-page">
                <div className="batch-bg" />
                <div className="batch-noise" />
                <div className="batch-container">
                    <section className="card">
                        {errorText || "Партия не найдена"}
                        <div style={{ marginTop: 12 }}>
                            <button className="btn" onClick={() => navigate("/batches")}>
                                Назад
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    const productName = productById.get(batch.productId)?.name ?? `Product #${batch.productId}`;

    return (
        <div className="batch-page">
            <div className="batch-bg" />
            <div className="batch-noise" />

            <div className="batch-container">
                <header className="card batch-header">
                    <div>
                        <h1 className="batch-title">Партия: {batch.batchNumber}</h1>
                        <p className="batch-subtitle">
                            Продукт: <b>{productName}</b> | Создана: {formatDateTime(batch.createdAt)}
                        </p>
                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                            <span className={statusClass(batch.status)}>{batch.status}</span>
                            <span className="batch-subtitle">
                                Выход за допуск: <b>{analysis?.outOfSpecPercent ?? 0}%</b>
                            </span>
                        </div>
                    </div>

                    <div className="actions">
                        <button className="btn" onClick={() => navigate("/batches")}>
                            Назад
                        </button>
                        <button className="btn" onClick={() => void load()}>
                            Обновить
                        </button>
                        {canDeleteBatch && (
                            <button className="btn" onClick={() => void onDeleteBatch()} disabled={deleteBusy}>
                                {deleteBusy ? "Удаление..." : "Удалить партию"}
                            </button>
                        )}
                    </div>
                </header>

                {errorText && (
                    <section className="card" style={{ color: "rgba(255, 120, 130, 0.95)" }}>
                        {errorText}
                    </section>
                )}

                <section className="batch-grid">
                    <div className="card">
                        <h2 className="section-title">Добавить измерение</h2>
                        <form className="form-grid" onSubmit={onAddMeasurement}>
                            <label className="label">
                                Показатель
                                <select
                                    className="select"
                                    value={addMetricId ?? ""}
                                    onChange={(e) => setAddMetricId(Number(e.target.value))}
                                >
                                    {metrics.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} ({m.unit})
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="label">
                                Значение
                                <input
                                    className="input"
                                    value={addValue}
                                    onChange={(e) => setAddValue(e.target.value)}
                                    placeholder="Например 12.4"
                                    required
                                />
                            </label>

                            <label className="label">
                                Время измерения (опционально)
                                <input
                                    className="input"
                                    type="datetime-local"
                                    value={addMeasuredAt}
                                    onChange={(e) => setAddMeasuredAt(e.target.value)}
                                />
                            </label>

                            <button className="btn primary" type="submit" disabled={addBusy}>
                                {addBusy ? "Сохранение..." : "Добавить"}
                            </button>
                        </form>
                    </div>

                    <div className="card">
                        <h2 className="section-title">Импорт из файла</h2>
                        <p className="batch-subtitle" style={{ marginBottom: 12 }}>
                            Формат CSV: <code>metricId,value,measuredAt</code> или{" "}
                            <code>metricName,value,measuredAt</code>
                        </p>
                        <form className="form-grid" onSubmit={onImport}>
                            <label className="label">
                                CSV файл измерений
                                <input
                                    className="input"
                                    type="file"
                                    accept=".csv,text/csv"
                                    onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                                    required
                                />
                            </label>

                            <button className="btn primary" type="submit" disabled={importBusy || !importFile}>
                                {importBusy ? "Загрузка..." : "Загрузить и проверить"}
                            </button>
                        </form>
                        {importResultText && (
                            <div className="batch-subtitle" style={{ marginTop: 10 }}>
                                {importResultText}
                            </div>
                        )}
                        {importErrors.length > 0 && (
                            <div style={{ marginTop: 10 }}>
                                <div className="batch-subtitle" style={{ marginBottom: 6 }}>
                                    Ошибки импорта (показано до 10):
                                </div>
                                <ul className="batch-subtitle" style={{ margin: 0, paddingLeft: 16 }}>
                                    {importErrors.slice(0, 10).map((err) => (
                                        <li key={`${err.row}-${err.message}`}>
                                            Строка {err.row}: {err.message}
                                        </li>
                                    ))}
                                </ul>
                                {importErrors.length > 10 && (
                                    <div className="batch-subtitle" style={{ marginTop: 6 }}>
                                        ...и еще {importErrors.length - 10}.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                <section className="card">
                    <h2 className="section-title">Первичный анализ по нормам</h2>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Показатель</th>
                                <th>Норма</th>
                                <th>Измерения</th>
                                <th>Мин</th>
                                <th>Среднее</th>
                                <th>Макс</th>
                                <th>Вне допуска</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(analysis?.stats || []).map((s) => {
                                const metric = metricById.get(s.metricId);
                                const norm = normByMetricId.get(s.metricId);
                                const measuredValues = measuredValuesByMetricId.get(s.metricId) ?? [];
                                const outPercent = s.count === 0 ? 0 : Math.round((s.outOfSpecCount / s.count) * 100);
                                return (
                                    <tr key={s.metricId}>
                                        <td>{metric ? `${metric.name} (${metric.unit})` : `Metric #${s.metricId}`}</td>
                                        <td>{formatNorm(norm?.minValue ?? null, norm?.maxValue ?? null)}</td>
                                        <td>{formatMeasuredValues(measuredValues)}</td>
                                        <td>{formatNumber(s.min)}</td>
                                        <td>{formatNumber(s.avg)}</td>
                                        <td>{formatNumber(s.max)}</td>
                                        <td>
                                            {s.outOfSpecCount}/{s.count} ({outPercent}%)
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>

                <section className="card">
                    <h2 className="section-title">Загруженные измерения</h2>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Время</th>
                                <th>Показатель</th>
                                <th>Значение</th>
                            </tr>
                        </thead>
                        <tbody>
                            {measurements.map((m) => {
                                const metric = metricById.get(m.metricId);
                                return (
                                    <tr key={m.id}>
                                        <td>{formatDateTime(m.measuredAt)}</td>
                                        <td>{metric ? `${metric.name} (${metric.unit})` : `Metric #${m.metricId}`}</td>
                                        <td>{formatNumber(m.value)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>
            </div>
        </div>
    );
};

const formatDateTime = (iso: string): string => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
};

const formatNorm = (minValue: number | null, maxValue: number | null): string => {
    if (minValue == null && maxValue == null) return "Не задана";
    if (minValue != null && maxValue != null) return `${formatNumber(minValue)} .. ${formatNumber(maxValue)}`;
    if (minValue != null) return `>= ${formatNumber(minValue)}`;
    return `<= ${formatNumber(maxValue as number)}`;
};

const formatNumber = (value: number): string => (Number.isInteger(value) ? String(value) : value.toFixed(3));

const formatMeasuredValues = (values: number[]): string => {
    if (values.length === 0) return "Нет данных";
    const maxShown = 8;
    const shown = values.slice(0, maxShown).map(formatNumber).join(", ");
    const rest = values.length - maxShown;
    if (rest <= 0) return shown;
    return `${shown} ... (+${rest})`;
};
