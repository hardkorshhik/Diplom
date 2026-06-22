import React, { useEffect, useState } from "react";
import "./appHeader.css";

export type PeriodDays = 7 | 30 | 90;
type ThemeMode = "dark" | "light";

const THEME_STORAGE_KEY = "app-theme";

const readTheme = (): ThemeMode =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark";

const applyTheme = (theme: ThemeMode): void => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
};

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
    const [theme, setTheme] = useState<ThemeMode>(readTheme);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const nextTheme = theme === "dark" ? "light" : "dark";

    return (
        <header className="app-header">
            <div className="app-header-inner">
                <div className="app-brand">
                    <div className="app-badge">LQ</div>
                    <h1 className="app-title">Панель контроля качества</h1>
                </div>

                <div className="app-actions">
                    <button className="app-btn primary" onClick={onOpenCreateBatch} title="Создать новую партию">
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
                            title="Период анализа"
                        >
                            <option value={7}>7 дней</option>
                            <option value={30}>30 дней</option>
                            <option value={90}>90 дней</option>
                        </select>
                    </div>

                    <button
                        className="app-btn theme-toggle"
                        type="button"
                        onClick={() => setTheme(nextTheme)}
                        title={theme === "dark" ? "Переключить на светлую тему" : "Переключить на темную тему"}
                        aria-label={theme === "dark" ? "Переключить на светлую тему" : "Переключить на темную тему"}
                    >
                        {theme === "dark" ? "Белая тема" : "Темная тема"}
                    </button>

                    <div className="app-user">
                        <div className="app-user-pill" title={userEmail ?? ""}>
                            {userRole ?? "-"} <span>{userEmail ? userEmail.split("@")[0] : ""}</span>
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
