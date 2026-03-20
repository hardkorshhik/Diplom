import React from "react";
import "./appHeader.css";

export type PeriodDays = 7 | 30 | 90;

type Props = {
    periodDays: PeriodDays;
    onChangePeriodDays: (days: PeriodDays) => void;

    onOpenCreateBatch: () => void;
    onOpenImportCsv: () => void;
    onLogout: () => void;

    userEmail?: string | null;
    userRole?: string | null;
};

export const AppHeader: React.FC<Props> = ({
    periodDays,
    onChangePeriodDays,
    onOpenCreateBatch,
    onOpenImportCsv,
    onLogout,
    userEmail,
    userRole,
}) => {
    return (
        <header className="app-header">
            <div className="app-header-inner">
                <div className="app-brand">
                    <div className="app-badge">LQ</div>
                    <h1 className="app-title">Панель контроля качества</h1>
                </div>

                <div className="app-actions">
                    <button
                        className="app-btn primary"
                        onClick={onOpenCreateBatch}
                        title="Создать новую партию"
                    >
                        Новая партия
                    </button>

                    <button
                        className="app-btn"
                        onClick={onOpenImportCsv}
                        title="Импорт измерений в существующую партию"
                    >
                        Импорт в партию
                    </button>

                    <div className="app-filter">
                        <span className="app-filter-inline">Период:</span>
                        <select
                            className="app-select"
                            value={periodDays}
                            onChange={(e) => onChangePeriodDays(Number(e.target.value) as PeriodDays)}
                            title="Период"
                        >
                            <option value={7}>7 дней</option>
                            <option value={30}>30 дней</option>
                            <option value={90}>90 дней</option>
                        </select>
                    </div>

                    <div className="app-user">
                        <div className="app-user-pill" title={userEmail ?? ""}>
                            {userRole ?? "—"} <span>{userEmail ? userEmail.split("@")[0] : ""}</span>
                        </div>
                        <button className="app-btn" onClick={onLogout} title="Выйти из системы">
                            Выйти
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
