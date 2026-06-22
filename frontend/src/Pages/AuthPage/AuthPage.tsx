import React, { useCallback, useState } from "react";
import "./auth.css";
import { putTokenInCookie } from "../../Cookie";
import { useNavigate } from "react-router-dom";
import { fetchLogin } from "../../Api/AuthApi";

export const AuthPage: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorText, setErrorText] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const onSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setErrorText(null);
            setLoading(true);

            try {
                const jwt = await fetchLogin({ email, password });
                if (!jwt) {
                    setErrorText("Не удалось войти. Проверьте логин и пароль.");
                    return;
                }

                putTokenInCookie(jwt);
                navigate("/dashboard", { replace: true });
            } catch {
                setErrorText("Не удалось войти. Проверьте логин и пароль.");
            } finally {
                setLoading(false);
            }
        },
        [email, password, navigate]
    );

    return (
        <div className="auth-page">
            <div className="auth-bg" />
            <div className="auth-noise" />

            <div className="auth-card" role="dialog" aria-label="Авторизация">
                <div className="auth-header">
                    <div className="auth-badge">LQ</div>
                    <h1 className="auth-title">Вход в систему</h1>
                    <p className="auth-subtitle">
                        Автоматизация сбора и первичного анализа данных о качестве продукции предприятия.
                    </p>
                </div>

                <form className="auth-form" onSubmit={onSubmit}>
                    <label className="auth-label">
                        Логин (email)
                        <input
                            className="auth-input"
                            type="email"
                            placeholder="lab@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="username"
                            required
                        />
                    </label>

                    <label className="auth-label">
                        Пароль
                        <input
                            className="auth-input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </label>

                    <button className="auth-button" type="submit" disabled={loading}>
                        {loading ? "Вход..." : "Войти"}
                    </button>

                    {errorText && <div style={{ fontSize: 12, color: "rgba(255, 90, 110, 0.95)" }}>{errorText}</div>}

                    <div className="auth-footer">
                        <span className="auth-hint">Доступ защищен JWT-токеном.</span>
                    </div>

                </form>
            </div>
        </div>
    );
};
