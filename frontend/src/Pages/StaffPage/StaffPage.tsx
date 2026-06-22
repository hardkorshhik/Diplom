import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./staff.css";
import { useNavigate } from "react-router-dom";
import { clearTokenCookie } from "../../Cookie";
import {
    createUser,
    deleteUser,
    getUsers,
    updateUser,
    type UserDto,
    type UserRole,
} from "../../Api/LabApi";

const roleLabel: Record<UserRole, string> = {
    ADMIN: "ADMIN",
    QA: "QA",
    LAB: "LAB",
};

const rightsByRole: Record<UserRole, string[]> = {
    ADMIN: [
        "Полный доступ к системе и справочникам",
        "Управление сотрудниками и ролями",
        "Удаление партий и обслуживание данных",
    ],
    QA: [
        "Просмотр партий, измерений и норм",
        "Контроль отклонений и анализ качества",
        "Подготовка экспертного заключения",
    ],
    LAB: [
        "Создание партий",
        "Ввод и импорт измерений",
        "Просмотр результатов первичного анализа",
    ],
};

const generatePassword = (len: number = 12): string => {
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const digits = "23456789";
    const symbols = "!@#$%&*_-+?";
    const all = lower + upper + digits + symbols;

    const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
    const chars: string[] = [pick(lower), pick(upper), pick(digits), pick(symbols)];

    for (let i = chars.length; i < len; i++) chars.push(pick(all));
    for (let i = chars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join("");
};

export const StaffPage: React.FC = () => {
    const navigate = useNavigate();

    const [staff, setStaff] = useState<UserDto[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [errorText, setErrorText] = useState<string | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<UserDto | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setErrorText(null);
        try {
            const users = await getUsers();
            setStaff(users);
        } catch (e: unknown) {
            setErrorText(e instanceof Error ? e.message : "Не удалось загрузить список сотрудников");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const adminsCount = useMemo(() => staff.filter((x) => x.role === "ADMIN").length, [staff]);

    const filteredStaff = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return staff;
        return staff.filter((s) => `${s.fullName} ${s.email} ${s.role}`.toLowerCase().includes(q));
    }, [query, staff]);

    const onDelete = useCallback(
        async (id: number) => {
            const member = staff.find((x) => x.id === id);
            if (!member) return;

            if (member.role === "ADMIN" && adminsCount <= 1) {
                alert("Нельзя удалить единственного администратора.");
                return;
            }

            const ok = window.confirm(`Удалить сотрудника "${member.fullName}" (${member.email})?`);
            if (!ok) return;

            try {
                await deleteUser(id);
                await load();
                if (editing?.id === id) {
                    setEditOpen(false);
                    setEditing(null);
                }
            } catch (e: unknown) {
                alert(e instanceof Error ? e.message : "Не удалось удалить сотрудника");
            }
        },
        [adminsCount, editing?.id, load, staff]
    );

    return (
        <div className="staff-page">
            <div className="staff-bg" />
            <div className="staff-noise" />

            <div className="staff-container">
                <header className="card staff-header">
                    <div style={{ minWidth: 0 }}>
                        <h1 className="staff-title">Сотрудники и роли доступа</h1>
                        <p className="staff-subtitle">
                            Раздел доступен роли <b>ADMIN</b>. Здесь настраиваются реальные учетные записи и роли
                            (`ADMIN`, `QA`, `LAB`) для работы системы контроля качества.
                        </p>

                        <div style={{ marginTop: 10, maxWidth: 420 }}>
                            <input
                                className="input"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Поиск по ФИО, email или роли"
                            />
                        </div>
                    </div>

                    <div className="actions">
                        <button className="btn primary" onClick={() => setCreateOpen(true)}>
                            + Сотрудник
                        </button>

                        <button className="btn" onClick={() => navigate("/dashboard")}>
                            Назад
                        </button>

                        <button
                            className="btn"
                            onClick={() => {
                                clearTokenCookie();
                                navigate("/auth", { replace: true });
                            }}
                        >
                            Выйти
                        </button>
                    </div>
                </header>

                {errorText && (
                    <section className="card" style={{ color: "rgba(255, 120, 130, 0.95)" }}>
                        {errorText}
                    </section>
                )}

                <section className="card">
                    <div className="small" style={{ marginBottom: 10 }}>
                        Показано: {filteredStaff.length} / {staff.length}
                        {query.trim() ? ` (фильтр: "${query.trim()}")` : ""}
                    </div>

                    {loading ? (
                        <div className="small">Загрузка...</div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Сотрудник</th>
                                    <th>Email</th>
                                    <th>Роль</th>
                                    <th>Права</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStaff.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <div style={{ fontWeight: 800 }}>{s.fullName}</div>
                                            <div className="small">ID: {s.id}</div>
                                        </td>
                                        <td>{s.email}</td>
                                        <td>
                                            <span className="role-pill">{roleLabel[s.role]}</span>
                                        </td>
                                        <td>
                                            <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
                                                {rightsByRole[s.role].map((x) => (
                                                    <li key={x}>{x}</li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td style={{ width: 220 }}>
                                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                                <button
                                                    className="btn"
                                                    onClick={() => {
                                                        setEditing(s);
                                                        setEditOpen(true);
                                                    }}
                                                >
                                                    Редактировать
                                                </button>
                                                <button className="btn" onClick={() => void onDelete(s.id)}>
                                                    Удалить
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {filteredStaff.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="small" style={{ padding: "14px 8px" }}>
                                            Ничего не найдено.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </section>
            </div>

            {createOpen && (
                <StaffModal
                    title="Добавить сотрудника"
                    mode="create"
                    onClose={() => setCreateOpen(false)}
                    onSubmit={async (m) => {
                        try {
                            await createUser({
                                fullName: m.fullName,
                                email: m.email,
                                role: m.role,
                                password: m.password || generatePassword(12),
                            });
                            setCreateOpen(false);
                            await load();
                        } catch (e: unknown) {
                            alert(e instanceof Error ? e.message : "Не удалось создать сотрудника");
                        }
                    }}
                />
            )}

            {editOpen && editing && (
                <StaffModal
                    title="Редактировать сотрудника"
                    mode="edit"
                    initial={editing}
                    onClose={() => {
                        setEditOpen(false);
                        setEditing(null);
                    }}
                    onSubmit={async (m) => {
                        try {
                            await updateUser(editing.id, {
                                fullName: m.fullName,
                                email: m.email,
                                role: m.role,
                                password: m.password || undefined,
                            });
                            setEditOpen(false);
                            setEditing(null);
                            await load();
                        } catch (e: unknown) {
                            alert(e instanceof Error ? e.message : "Не удалось обновить сотрудника");
                        }
                    }}
                    onDelete={() => void onDelete(editing.id)}
                    deleteDisabled={editing.role === "ADMIN" && adminsCount <= 1}
                />
            )}
        </div>
    );
};

type StaffModalModel = {
    fullName: string;
    email: string;
    role: UserRole;
    password?: string;
};

const StaffModal: React.FC<{
    title: string;
    mode: "create" | "edit";
    initial?: UserDto;
    onClose: () => void;
    onSubmit: (model: StaffModalModel) => void;
    onDelete?: () => void;
    deleteDisabled?: boolean;
}> = ({ title, mode, initial, onClose, onSubmit, onDelete, deleteDisabled }) => {
    const [fullName, setFullName] = useState(initial?.fullName ?? "");
    const [email, setEmail] = useState(initial?.email ?? "");
    const [role, setRole] = useState<UserRole>(initial?.role ?? "LAB");
    const [password, setPassword] = useState(mode === "create" ? generatePassword(12) : "");
    const [showPassword, setShowPassword] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            role,
            password: password.trim() || undefined,
        });
    };

    return (
        <div className="modal-overlay" onMouseDown={(e) => e.currentTarget === e.target && onClose()}>
            <div className="modal card">
                <h2 className="staff-title" style={{ marginBottom: 0 }}>
                    {title}
                </h2>
                <p className="staff-subtitle" style={{ marginTop: 6 }}>
                    Права назначаются выбранной ролью.
                </p>

                <form className="form-grid" onSubmit={submit}>
                    <label className="label">
                        ФИО / должность
                        <input
                            className="input"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Например: Лаборант смены №3"
                            required
                        />
                    </label>

                    <label className="label">
                        Email
                        <input
                            className="input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            required
                        />
                    </label>

                    <label className="label">
                        Роль
                        <select className="select" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                            <option value="LAB">LAB (лаборант)</option>
                            <option value="QA">QA (инженер по качеству)</option>
                            <option value="ADMIN">ADMIN (администратор)</option>
                        </select>
                    </label>

                    <label className="label">
                        {mode === "create" ? "Начальный пароль" : "Новый пароль (опционально)"}
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <input
                                className="input"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={mode === "create" ? "Сгенерирован автоматически" : "Оставьте пустым, чтобы не менять"}
                                required={mode === "create"}
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                className="btn"
                                onClick={() => setPassword(generatePassword(12))}
                                title="Сгенерировать пароль"
                            >
                                Ген.
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={() => setShowPassword((v) => !v)}
                                title={showPassword ? "Скрыть пароль" : "Показать пароль"}
                            >
                                {showPassword ? "Скрыть" : "Показать"}
                            </button>
                        </div>
                    </label>

                    <div>
                        <div className="small">Права роли:</div>
                        <ul className="small" style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                            {rightsByRole[role].map((x) => (
                                <li key={x}>{x}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="modal-actions" style={{ justifyContent: "space-between" }}>
                        {mode === "edit" && onDelete ? (
                            <button
                                className="btn"
                                type="button"
                                onClick={onDelete}
                                disabled={!!deleteDisabled}
                                title={deleteDisabled ? "Нельзя удалить единственного администратора" : "Удалить сотрудника"}
                            >
                                Удалить
                            </button>
                        ) : (
                            <span />
                        )}

                        <div style={{ display: "flex", gap: 10 }}>
                            <button className="btn" type="button" onClick={onClose}>
                                Отмена
                            </button>
                            <button className="btn primary" type="submit">
                                Сохранить
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
