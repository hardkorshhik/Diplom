import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./dashboard.css";
import { useNavigate } from "react-router-dom";
import { AppHeader, PeriodDays } from "../../Components/AppHeader/AppHeader";
import { clearTokenCookie, getTokenFromCookies } from "../../Cookie";
import { parseJwt } from "../../Auth/Jwt";
import {
    createBatch,
    getBatchAnalysis,
    getBatches,
    getMetrics,
    getProducts,
    importMeasurements,
    type BatchAnalysisDto,
    type BatchDto,
    type BatchStatus,
    type ProductDto,
} from "../../Api/LabApi";

type Summary = {
    totalBatches: number;
    okCount: number;
    warningCount: number;
    failCount: number;
    avgOutOfSpecPercent: number;
    lastBatch: { id: number; batchNumber: string; status: BatchStatus; createdAt: string } | null;
};

type TrendPoint = { date: string; badPercent: number; avgOutOfSpec: number };
type TopItem = { name: string; count: number };
type RecentBatch = { id: number; product: string; batchNumber: string; createdAt: string; status: BatchStatus };

type DashboardData = {
    summary: Summary;
    trend: TrendPoint[];
    topMetrics: TopItem[];
    topProducts: TopItem[];
    recent: RecentBatch[];
    products: ProductDto[];
};

const statusClass = (s: BatchStatus) => {
    if (s === "OK") return "status-pill status-ok";
    if (s === "WARNING") return "status-pill status-warn";
    return "status-pill status-fail";
};

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [days, setDays] = useState<PeriodDays>(30);
    const [createBatchOpen, setCreateBatchOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errorText, setErrorText] = useState<string | null>(null);
    const [data, setData] = useState<DashboardData>(emptyDashboardData());

    const token = getTokenFromCookies();
    const payload = token ? parseJwt(token) : null;
    const userEmail = (payload?.sub as string | undefined) ?? null;
    const userRole = (payload?.role as string | undefined) ?? null;

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setErrorText(null);
        try {
            const [allBatches, allProducts, allMetrics] = await Promise.all([
                getBatches(),
                getProducts(),
                getMetrics(),
            ]);

            const now = Date.now();
            const periodStart = now - days * 24 * 60 * 60 * 1000;
            const batchesInPeriod = allBatches.filter((b) => new Date(b.createdAt).getTime() >= periodStart);

            const analysisEntries = await Promise.all(
                batchesInPeriod.map(async (b) => {
                    try {
                        const analysis = await getBatchAnalysis(b.id);
                        return [b.id, analysis] as const;
                    } catch {
                        return [b.id, { status: b.status, outOfSpecPercent: 0, stats: [] } as BatchAnalysisDto] as const;
                    }
                })
            );
            const analysisByBatchId = new Map<number, BatchAnalysisDto>(analysisEntries);

            const productById = new Map(allProducts.map((p) => [p.id, p]));
            const metricById = new Map(allMetrics.map((m) => [m.id, m]));

            const sorted = [...batchesInPeriod].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            const totalBatches = sorted.length;
            const okCount = sorted.filter((b) => b.status === "OK").length;
            const warningCount = sorted.filter((b) => b.status === "WARNING").length;
            const failCount = sorted.filter((b) => b.status === "FAIL").length;

            const avgOutOfSpecPercent = totalBatches
                ? Math.round(
                    sorted.reduce((acc, b) => acc + (analysisByBatchId.get(b.id)?.outOfSpecPercent ?? 0), 0) / totalBatches
                )
                : 0;

            const summary: Summary = {
                totalBatches,
                okCount,
                warningCount,
                failCount,
                avgOutOfSpecPercent,
                lastBatch: sorted[0]
                    ? {
                        id: sorted[0].id,
                        batchNumber: sorted[0].batchNumber,
                        status: sorted[0].status,
                        createdAt: sorted[0].createdAt,
                    }
                    : null,
            };

            const trend = buildTrend(sorted, analysisByBatchId, days);

            const metricOutCount = new Map<number, number>();
            analysisByBatchId.forEach((analysis) => {
                analysis.stats.forEach((s) => {
                    metricOutCount.set(s.metricId, (metricOutCount.get(s.metricId) || 0) + s.outOfSpecCount);
                });
            });

            const topMetrics: TopItem[] = Array.from(metricOutCount.entries())
                .map(([metricId, count]) => ({
                    name: metricById.get(metricId)?.name ?? `Metric #${metricId}`,
                    count,
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            const topProductsMap = new Map<number, number>();
            sorted.forEach((b) => {
                if (b.status === "OK") return;
                topProductsMap.set(b.productId, (topProductsMap.get(b.productId) || 0) + 1);
            });
            const topProducts: TopItem[] = Array.from(topProductsMap.entries())
                .map(([productId, count]) => ({
                    name: productById.get(productId)?.name ?? `Product #${productId}`,
                    count,
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            const recent: RecentBatch[] = sorted.slice(0, 8).map((b) => ({
                id: b.id,
                product: productById.get(b.productId)?.name ?? `Product #${b.productId}`,
                batchNumber: b.batchNumber,
                createdAt: b.createdAt,
                status: b.status,
            }));

            setData({
                summary,
                trend,
                topMetrics,
                topProducts,
                recent,
                products: allProducts,
            });
        } catch (e: unknown) {
            setErrorText(e instanceof Error ? e.message : "Не удалось загрузить данные dashboard");
            setData(emptyDashboardData());
        } finally {
            setLoading(false);
        }
    }, [days]);

    useEffect(() => {
        void loadDashboard();
    }, [loadDashboard]);

    return (
        <div className="dash-page">
            <div className="dash-bg" />
            <div className="dash-noise" />

            <AppHeader
                periodDays={days}
                onChangePeriodDays={setDays}
                onOpenCreateBatch={() => setCreateBatchOpen(true)}
                onOpenImportCsv={() => setImportOpen(true)}
                onLogout={() => {
                    clearTokenCookie();
                    navigate("/auth", { replace: true });
                }}
                userEmail={userEmail}
                userRole={userRole}
            />

            <div className="dash-content">
                <div className="dash-container">
                    <section className="card">
                        <div className="kpi-title">
                            Логика работы:
                            `Новая партия` — сначала создаёте партию.
                            `Импорт в партию` — загружаете файл измерений в уже созданную партию.
                        </div>
                    </section>

                    {errorText && (
                        <section className="card" style={{ color: "rgba(255, 120, 130, 0.95)" }}>
                            {errorText}
                        </section>
                    )}

                    <section className="dash-kpis">
                        <Kpi title="Партии" value={data.summary.totalBatches} hint={`за ${days} дней`} />
                        <Kpi title="OK" value={data.summary.okCount} hint="в допуске" accent="ok" />
                        <Kpi title="WARNING" value={data.summary.warningCount} hint="частично вне допуска" accent="warn" />
                        <Kpi title="FAIL" value={data.summary.failCount} hint="критично" accent="fail" />
                        <Kpi title="% вне допуска" value={`${data.summary.avgOutOfSpecPercent}%`} hint="среднее" />

                        <div className="card">
                            <div className="kpi-title">Последняя партия</div>
                            <div className="kpi-value">{data.summary.lastBatch ? data.summary.lastBatch.batchNumber : "—"}</div>
                            <div className="kpi-hint">
                                {data.summary.lastBatch ? (
                                    <>
                                        <span className={statusClass(data.summary.lastBatch.status)} style={{ marginRight: 8 }}>
                                            {data.summary.lastBatch.status}
                                        </span>
                                        <span>{formatDate(data.summary.lastBatch.createdAt)}</span>
                                    </>
                                ) : (
                                    "нет данных"
                                )}
                            </div>
                        </div>
                    </section>

                    <div className="dash-grid">
                        <section className="card">
                            <h2 className="dash-section-title">Тренд качества (упрощённо)</h2>
                            {loading ? <div className="kpi-title">Загрузка...</div> : <TrendSimple points={data.trend} />}
                        </section>

                        <section className="card">
                            <h2 className="dash-section-title">Топ проблем</h2>

                            <div className="list" style={{ marginBottom: 12 }}>
                                <div className="kpi-title">Показатели (выходы за допуск)</div>
                                {data.topMetrics.map((x) => (
                                    <div className="list-item" key={`m-${x.name}`}>
                                        <div className="list-left">
                                            <div className="list-title">{x.name}</div>
                                            <div className="list-subtitle">выходов за норму</div>
                                        </div>
                                        <div className="list-value">{x.count}</div>
                                    </div>
                                ))}
                                {data.topMetrics.length === 0 && <div className="kpi-title">Пока нет данных</div>}
                            </div>

                            <div className="list">
                                <div className="kpi-title">Продукты (проблемные партии)</div>
                                {data.topProducts.map((x) => (
                                    <div className="list-item" key={`p-${x.name}`}>
                                        <div className="list-left">
                                            <div className="list-title">{x.name}</div>
                                            <div className="list-subtitle">WARNING + FAIL</div>
                                        </div>
                                        <div className="list-value">{x.count}</div>
                                    </div>
                                ))}
                                {data.topProducts.length === 0 && <div className="kpi-title">Пока нет данных</div>}
                            </div>
                        </section>
                    </div>

                    <section className="card">
                        <h2 className="dash-section-title">Последние партии</h2>
                        <table className="table">
                            <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Продукт</th>
                                <th>Партия</th>
                                <th>Статус</th>
                            </tr>
                            </thead>
                            <tbody>
                            {data.recent.map((b) => (
                                <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/batches/${b.id}`)}>
                                    <td>{formatDate(b.createdAt)}</td>
                                    <td>{b.product}</td>
                                    <td>{b.batchNumber}</td>
                                    <td><span className={statusClass(b.status)}>{b.status}</span></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </section>
                </div>
            </div>

            {createBatchOpen && (
                <CreateBatchModal
                    products={data.products}
                    onClose={() => setCreateBatchOpen(false)}
                    onCreated={(newId) => {
                        setCreateBatchOpen(false);
                        navigate(`/batches/${newId}`);
                    }}
                />
            )}

            {importOpen && (
                <ImportCsvModal
                    onClose={() => setImportOpen(false)}
                    onDone={() => {
                        setImportOpen(false);
                        void loadDashboard();
                    }}
                    onNeedCreate={() => {
                        setImportOpen(false);
                        setCreateBatchOpen(true);
                    }}
                />
            )}
        </div>
    );
};

const Kpi: React.FC<{ title: string; value: React.ReactNode; hint: string; accent?: "ok" | "warn" | "fail" }> = ({
    title,
    value,
    hint,
    accent,
}) => {
    const valueClass =
        accent === "ok"
            ? "kpi-value kpi-ok"
            : accent === "warn"
                ? "kpi-value kpi-warn"
                : accent === "fail"
                    ? "kpi-value kpi-fail"
                    : "kpi-value";

    return (
        <div className="card">
            <div className="kpi-title">{title}</div>
            <div className={valueClass}>{value}</div>
            <div className="kpi-hint">{hint}</div>
        </div>
    );
};

const TrendSimple: React.FC<{ points: TrendPoint[] }> = ({ points }) => {
    const max = Math.max(1, ...points.map((p) => p.badPercent));
    return (
        <div style={{ display: "grid", gap: 10 }}>
            {points.map((p) => (
                <div key={p.date} style={{ display: "grid", gridTemplateColumns: "72px 1fr 52px", gap: 10, alignItems: "center" }}>
                    <div className="kpi-title">{p.date}</div>
                    <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                        <div
                            style={{
                                height: "100%",
                                width: `${Math.round((p.badPercent / max) * 100)}%`,
                                background: "rgba(70, 120, 255, 0.55)",
                            }}
                        />
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(233,238,248,0.85)", fontWeight: 800 }}>{p.badPercent}%</div>
                </div>
            ))}
            <div className="kpi-title">Доля проблемных партий (WARNING + FAIL) по дням.</div>
        </div>
    );
};

const CreateBatchModal: React.FC<{
    products: ProductDto[];
    onClose: () => void;
    onCreated: (id: number) => void;
}> = ({ products, onClose, onCreated }) => {
    const [productId, setProductId] = useState<number>(products[0]?.id ?? 0);
    const [batchNumber, setBatchNumber] = useState<string>("");
    const [comment, setComment] = useState<string>("");
    const [busy, setBusy] = useState(false);
    const [errorText, setErrorText] = useState<string | null>(null);

    useEffect(() => {
        if (products[0] && !productId) setProductId(products[0].id);
    }, [productId, products]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productId) return;

        setBusy(true);
        setErrorText(null);
        try {
            const created = await createBatch({
                productId,
                batchNumber: batchNumber.trim(),
                comment: comment.trim() || undefined,
            });
            onCreated(created.id);
        } catch (e: unknown) {
            setErrorText(e instanceof Error ? e.message : "Не удалось создать партию");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="modal-overlay" onMouseDown={(e) => e.currentTarget === e.target && onClose()}>
            <div className="modal card">
                <h2 className="dash-section-title">Создать партию</h2>

                <form className="form-grid" onSubmit={onSubmit}>
                    <label className="label">
                        Продукт
                        <select className="select" value={productId} onChange={(e) => setProductId(Number(e.target.value))}>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </label>

                    <label className="label">
                        Номер партии
                        <input
                            className="input"
                            value={batchNumber}
                            onChange={(e) => setBatchNumber(e.target.value)}
                            placeholder="например B-2026-02-08-01"
                            required
                        />
                    </label>

                    <label className="label">
                        Комментарий (опционально)
                        <textarea
                            className="textarea"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="например: смена №2, лаборатория №1"
                        />
                    </label>

                    {errorText && <div style={{ fontSize: 12, color: "rgba(255, 90, 110, 0.95)" }}>{errorText}</div>}

                    <div className="modal-actions">
                        <button className="btn" type="button" onClick={onClose}>Отмена</button>
                        <button className="btn primary" type="submit" disabled={busy}>
                            {busy ? "Создание..." : "Создать"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ImportCsvModal: React.FC<{
    onClose: () => void;
    onDone: () => void;
    onNeedCreate: () => void;
}> = ({ onClose, onDone, onNeedCreate }) => {
    const [batches, setBatches] = useState<BatchDto[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(true);
    const [batchId, setBatchId] = useState<number>(0);
    const [file, setFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const [resultText, setResultText] = useState<string | null>(null);
    const [errorText, setErrorText] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoadingBatches(true);
            setErrorText(null);
            try {
                const fetched = await getBatches();
                const sorted = [...fetched].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setBatches(sorted);
                setBatchId(sorted[0]?.id ?? 0);
            } catch (e: unknown) {
                setErrorText(e instanceof Error ? e.message : "Не удалось загрузить список партий");
            } finally {
                setLoadingBatches(false);
            }
        };
        void load();
    }, []);

    const hasBatches = useMemo(() => batches.length > 0, [batches.length]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!batchId || !file) return;

        setBusy(true);
        setErrorText(null);
        setResultText(null);
        try {
            const result = await importMeasurements(batchId, file);
            setResultText(
                `Импортировано ${result.importedRows}/${result.totalRows}, пропущено ${result.skippedRows}. ` +
                `Выход за допуск: ${result.analysis.outOfSpecPercent}%.`
            );
            onDone();
        } catch (e: unknown) {
            setErrorText(e instanceof Error ? e.message : "Не удалось загрузить файл");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="modal-overlay" onMouseDown={(e) => e.currentTarget === e.target && onClose()}>
            <div className="modal card">
                <h2 className="dash-section-title">Импорт измерений (CSV)</h2>

                {!loadingBatches && !hasBatches ? (
                    <div className="form-grid">
                        <div className="kpi-title">
                            Пока нет ни одной партии. Сначала создайте партию через кнопку `Новая партия`,
                            затем вернитесь к импорту.
                        </div>
                        <div className="modal-actions">
                            <button className="btn" type="button" onClick={onClose}>Закрыть</button>
                            <button className="btn primary" type="button" onClick={onNeedCreate}>
                                Создать партию
                            </button>
                        </div>
                    </div>
                ) : (
                    <form className="form-grid" onSubmit={onSubmit}>
                        <label className="label">
                            Партия
                            <select
                                className="select"
                                value={batchId}
                                onChange={(e) => setBatchId(Number(e.target.value))}
                                disabled={loadingBatches || !hasBatches}
                            >
                                {batches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.batchNumber} ({formatDate(b.createdAt)})
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="label">
                            CSV файл
                            <input
                                className="input"
                                type="file"
                                accept=".csv,text/csv"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                required
                            />
                        </label>

                        {errorText && <div style={{ fontSize: 12, color: "rgba(255, 90, 110, 0.95)" }}>{errorText}</div>}
                        {resultText && <div className="kpi-title">{resultText}</div>}

                        <div className="modal-actions">
                            <button className="btn" type="button" onClick={onClose}>Отмена</button>
                            <button
                                className="btn primary"
                                type="submit"
                                disabled={busy || loadingBatches || !hasBatches || !file}
                            >
                                {busy ? "Загрузка..." : "Импортировать"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

function emptyDashboardData(): DashboardData {
    return {
        summary: {
            totalBatches: 0,
            okCount: 0,
            warningCount: 0,
            failCount: 0,
            avgOutOfSpecPercent: 0,
            lastBatch: null,
        },
        trend: [],
        topMetrics: [],
        topProducts: [],
        recent: [],
        products: [],
    };
}

function buildTrend(
    batches: BatchDto[],
    analysisByBatchId: Map<number, BatchAnalysisDto>,
    days: number
): TrendPoint[] {
    const maxPoints = Math.min(10, days);
    const result: TrendPoint[] = [];
    const now = new Date();

    for (let i = maxPoints - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const batchesByDay = batches.filter((b) => {
            const bd = new Date(b.createdAt);
            return `${bd.getFullYear()}-${bd.getMonth()}-${bd.getDate()}` === key;
        });

        const total = batchesByDay.length;
        const bad = batchesByDay.filter((b) => b.status === "WARNING" || b.status === "FAIL").length;
        const badPercent = total > 0 ? Math.round((bad / total) * 100) : 0;
        const avgOut =
            total > 0
                ? Math.round(
                    batchesByDay.reduce((acc, b) => acc + (analysisByBatchId.get(b.id)?.outOfSpecPercent ?? 0), 0) / total
                )
                : 0;

        result.push({
            date: `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`,
            badPercent,
            avgOutOfSpec: avgOut,
        });
    }

    return result;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
}
