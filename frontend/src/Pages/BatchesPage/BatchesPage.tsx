import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./batches.css";
import { useNavigate } from "react-router-dom";
import { deleteBatch, getBatches, getProducts, type BatchDto, type BatchStatus, type ProductDto } from "../../Api/LabApi";
import { getTokenFromCookies } from "../../Cookie";
import { parseJwt } from "../../Auth/Jwt";

const statusClass = (s: BatchStatus) => {
    if (s === "OK") return "status-pill status-ok";
    if (s === "WARNING") return "status-pill status-warn";
    return "status-pill status-fail";
};

export const BatchesPage: React.FC = () => {
    const navigate = useNavigate();
    const [rows, setRows] = useState<BatchDto[]>([]);
    const [products, setProducts] = useState<ProductDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorText, setErrorText] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const token = getTokenFromCookies();
    const role = (token ? parseJwt(token)?.role : null) as string | null;
    const canDeleteBatch = role === "ADMIN";

    const load = useCallback(async () => {
        setLoading(true);
        setErrorText(null);
        try {
            const [batchesData, productsData] = await Promise.all([getBatches(), getProducts()]);
            setRows(batchesData);
            setProducts(productsData);
        } catch (e: unknown) {
            setErrorText(e instanceof Error ? e.message : "Не удалось загрузить партии");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const onDelete = useCallback(
        async (batch: BatchDto) => {
            const ok = window.confirm(`Удалить партию "${batch.batchNumber}" вместе со всеми измерениями?`);
            if (!ok) return;

            setDeletingId(batch.id);
            setErrorText(null);
            try {
                await deleteBatch(batch.id);
                await load();
            } catch (e: unknown) {
                setErrorText(e instanceof Error ? e.message : "Не удалось удалить партию");
            } finally {
                setDeletingId(null);
            }
        },
        [load]
    );

    const productById = useMemo(() => new Map(products.map((p) => [p.id, p.name])), [products]);

    return (
        <div className="batches-page">
            <div className="batches-bg" />
            <div className="batches-noise" />

            <div className="batches-container">
                <header className="card batches-header">
                    <div>
                        <h1 className="batches-title">Партии</h1>
                        <p className="batches-subtitle">
                            Реестр партий с первичной оценкой соответствия нормам качества.
                        </p>
                    </div>

                    <div className="actions">
                        <button className="btn" onClick={() => navigate("/dashboard", { replace: true })}>
                            Назад
                        </button>
                        <button className="btn primary" onClick={() => navigate("/batches/new")}>
                            + Партия
                        </button>
                    </div>
                </header>

                {errorText && (
                    <section className="card" style={{ color: "rgba(255, 120, 130, 0.95)" }}>
                        {errorText}
                    </section>
                )}

                <section className="card">
                    {loading ? (
                        <div style={{ fontSize: 13, color: "var(--theme-soft)" }}>Загрузка...</div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Дата</th>
                                    <th>Продукт</th>
                                    <th>Партия</th>
                                    <th>Статус</th>
                                    {canDeleteBatch && <th></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((b) => (
                                    <tr
                                        className="row"
                                        key={b.id}
                                        onClick={() => navigate(`/batches/${b.id}`)}
                                        title="Открыть карточку партии"
                                    >
                                        <td>{formatDate(b.createdAt)}</td>
                                        <td>{productById.get(b.productId) ?? `Product #${b.productId}`}</td>
                                        <td>{b.batchNumber}</td>
                                        <td>
                                            <span className={statusClass(b.status)}>{b.status}</span>
                                        </td>
                                        {canDeleteBatch && (
                                            <td style={{ width: 140 }}>
                                                <button
                                                    className="btn"
                                                    type="button"
                                                    disabled={deletingId === b.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        void onDelete(b);
                                                    }}
                                                >
                                                    {deletingId === b.id ? "Удаление..." : "Удалить"}
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </div>
        </div>
    );
};

function formatDate(iso: string): string {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
}
