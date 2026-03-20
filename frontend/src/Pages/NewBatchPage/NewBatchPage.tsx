import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./newBatch.css";
import { useNavigate } from "react-router-dom";
import { createBatch, getProducts, type ProductDto } from "../../Api/LabApi";

type ProductOption = { id: number; name: string };

export const NewBatchPage: React.FC = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<ProductOption[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [submitBusy, setSubmitBusy] = useState(false);
    const [errorText, setErrorText] = useState<string | null>(null);

    const [productId, setProductId] = useState<number>(0);
    const [batchNumber, setBatchNumber] = useState<string>("");
    const [comment, setComment] = useState<string>("");

    useEffect(() => {
        const loadProducts = async () => {
            setLoadingProducts(true);
            setErrorText(null);
            try {
                const data = await getProducts();
                const mapped = data.map((p: ProductDto) => ({ id: p.id, name: p.name }));
                setProducts(mapped);
                if (mapped.length > 0) setProductId(mapped[0].id);
            } catch (e: unknown) {
                setErrorText(e instanceof Error ? e.message : "Не удалось загрузить список продуктов");
            } finally {
                setLoadingProducts(false);
            }
        };

        void loadProducts();
    }, []);

    const hasProducts = useMemo(() => products.length > 0, [products.length]);

    const onSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!hasProducts) return;

            setSubmitBusy(true);
            setErrorText(null);
            try {
                const created = await createBatch({
                    productId,
                    batchNumber: batchNumber.trim(),
                    comment: comment.trim() || undefined,
                });
                navigate(`/batches/${created.id}`, { replace: true });
            } catch (e: unknown) {
                setErrorText(e instanceof Error ? e.message : "Не удалось создать партию");
            } finally {
                setSubmitBusy(false);
            }
        },
        [batchNumber, comment, hasProducts, navigate, productId]
    );

    return (
        <div className="newbatch-page">
            <div className="newbatch-bg" />
            <div className="newbatch-noise" />

            <div className="newbatch-container">
                <header className="card header">
                    <div>
                        <h1 className="title">Создать партию</h1>
                        <p className="subtitle">
                            Создание партии для последующей загрузки измерений и первичного анализа качества.
                        </p>
                    </div>

                    <div className="actions">
                        <button className="btn" onClick={() => navigate("/batches")}>Назад</button>
                        <button className="btn primary" onClick={() => navigate("/dashboard")}>Dashboard</button>
                    </div>
                </header>

                {errorText && (
                    <section className="card" style={{ color: "rgba(255, 120, 130, 0.95)" }}>
                        {errorText}
                    </section>
                )}

                <section className="card">
                    <form className="form" onSubmit={onSubmit}>
                        <label className="label">
                            Продукт
                            <select
                                className="select"
                                value={productId}
                                onChange={(e) => setProductId(Number(e.target.value))}
                                disabled={loadingProducts || !hasProducts}
                            >
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
                                placeholder="например: смена №2, лаборатория №1, входной контроль"
                            />
                        </label>

                        <button className="btn primary" type="submit" disabled={!hasProducts || submitBusy}>
                            {submitBusy ? "Создание..." : "Создать"}
                        </button>

                        <div className="hint">
                            После создания откроется карточка партии, где можно добавить измерения вручную или загрузить CSV-файл.
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
};
