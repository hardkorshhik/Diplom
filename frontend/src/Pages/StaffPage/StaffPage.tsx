// src/Pages/StaffPage/StaffPage.tsx
import React, { useMemo, useState } from "react";
import "./staff.css";
import { useNavigate } from "react-router-dom";
import { clearTokenCookie } from "../../Cookie";

type StaffRole = "ADMIN" | "QA" | "LAB";

type StaffMember = {
    id: number;
    fullName: string;
    email: string;
    role: StaffRole;
};

const roleLabel: Record<StaffRole, string> = {
    ADMIN: "ADMIN",
    QA: "QA",
    LAB: "LAB",
};

const rightsByRole: Record<StaffRole, string[]> = {
    ADMIN: ["CRUD пользователей", "CRUD продуктов/метрик/норм", "Просмотр всех партий и измерений"],
    QA: ["Просмотр партий/измерений/норм", "Анализ отклонений", "Отчёты/заключения (демо)"],
    LAB: ["Создание партий", "Добавление/импорт измерений", "Просмотр результатов сравнения"],
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

    const initialStaff = useMemo<StaffMember[]>(
        () => [
            { id: 1, fullName: "Системный администратор", email: "admin@ammophos.ru", role: "ADMIN" },
            { id: 2, fullName: "Инженер по качеству (ОТК)", email: "qa@ammophos.ru", role: "QA" },
            { id: 3, fullName: "Лаборант смены №1", email: "lab1@ammophos.ru", role: "LAB" },
            { id: 4, fullName: "Лаборант смены №2", email: "lab2@ammophos.ru", role: "LAB" },
        ],
        []
    );

    const [staff, setStaff] = useState<StaffMember[]>(initialStaff);

    const [query, setQuery] = useState<string>("");

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editing, setEditing] = useState<StaffMember | null>(null);

    const openEdit = (member: StaffMember) => {
        setEditing(member);
        setEditOpen(true);
    };

    const onCreate = (m: { fullName: string; email: string; role: StaffRole; password?: string }) => {
        const nextId = Math.max(...staff.map((x) => x.id), 0) + 1;
        setStaff([{ id: nextId, fullName: m.fullName, email: m.email, role: m.role }, ...staff]);
        setCreateOpen(false);

    };

    const onUpdate = (updated: StaffMember) => {
        setStaff(staff.map((x) => (x.id === updated.id ? updated : x)));
        setEditOpen(false);
        setEditing(null);
    };

    const onDelete = (id: number) => {
        const member = staff.find((x) => x.id === id);
        if (!member) return;

        const adminsCount = staff.filter((x) => x.role === "ADMIN").length;
        if (member.role === "ADMIN" && adminsCount <= 1) {
            alert("Нельзя удалить единственного администратора.");
            return;
        }

        const ok = window.confirm(`Удалить сотрудника "${member.fullName}" (${member.email})?`);
        if (!ok) return;

        setStaff(staff.filter((x) => x.id !== id));

        if (editing?.id === id) {
            setEditOpen(false);
            setEditing(null);
        }
    };

    const filteredStaff = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return staff;

        return staff.filter((s) => {
            const hay = `${s.fullName} ${s.email} ${s.role}`.toLowerCase();
            return hay.includes(q);
        });
    }, [staff, query]);

    return (
        <div className="staff-page">
            <div className="staff-bg" />
            <div className="staff-noise" />

            <div className="staff-container">
                <header className="card staff-header">
                    <div style={{ minWidth: 0 }}>
                        <h1 className="staff-title">Сотрудники и роли доступа</h1>
                        <p className="staff-subtitle">
                            Управление сотрудниками доступно только роли <b>ADMIN</b>. Права назначаются по роли (ADMIN/QA/LAB).
                        </p>

                        <div style={{ marginTop: 10, maxWidth: 420 }}>
                            <input
                                className="input"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Поиск: email или роль (например: lab)"
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

                <section className="card">
                    <div className="small" style={{ marginBottom: 10 }}>
                        Показано: {filteredStaff.length} / {staff.length}
                        {query.trim() ? ` (фильтр: "${query.trim()}")` : ""}
                    </div>

                    <table className="table">
                        <thead>
                        <tr>
                            <th>Сотрудник</th>
                            <th>Email</th>
                            <th>Роль</th>
                            <th>Права (по роли)</th>
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
                                        <button className="btn" onClick={() => openEdit(s)}>
                                            Редактировать
                                        </button>
                                        <button className="btn" onClick={() => onDelete(s.id)} title="Удалить сотрудника">
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

                    <div className="small" style={{ marginTop: 10 }}>
                        Примечание для диплома: права назначаются по роли, чтобы исключить ошибки и упростить контроль доступа.
                    </div>
                </section>
            </div>

            {createOpen && (
                <StaffModal
                    title="Добавить сотрудника"
                    mode="create"
                    onClose={() => setCreateOpen(false)}
                    onSubmit={(m) => onCreate(m)}
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
                    onSubmit={(m) => onUpdate({ id: editing.id, fullName: m.fullName, email: m.email, role: m.role })}
                    onDelete={() => onDelete(editing.id)}
                    deleteDisabled={editing.role === "ADMIN" && staff.filter((x) => x.role === "ADMIN").length <= 1}
                />
            )}
        </div>
    );
};

type StaffModalModel = {
    fullName: string;
    email: string;
    role: StaffRole;
    password?: string;
};

const StaffModal: React.FC<{
    title: string;
    mode: "create" | "edit";
    initial?: StaffMember;
    onClose: () => void;
    onSubmit: (model: StaffModalModel) => void;
    onDelete?: () => void;
    deleteDisabled?: boolean;
}> = ({ title, mode, initial, onClose, onSubmit, onDelete, deleteDisabled }) => {
    const [fullName, setFullName] = useState(initial?.fullName ?? "");
    const [email, setEmail] = useState(initial?.email ?? "");
    const [role, setRole] = useState<StaffRole>(initial?.role ?? "LAB");

    const [password, setPassword] = useState<string>(mode === "create" ? generatePassword(12) : "");
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            role,
            ...(mode === "create" ? { password } : {}),
        });
    };

    return (
        <div className="modal-overlay" onMouseDown={(e) => e.currentTarget === e.target && onClose()}>
            <div className="modal card">
                <h2 className="staff-title" style={{ marginBottom: 0 }}>
                    {title}
                </h2>
                <p className="staff-subtitle" style={{ marginTop: 6 }}>
                    Права назначаются по выбранной роли.
                </p>

                <form className="form-grid" onSubmit={submit}>
                    <label className="label">
                        Должность
                        <input
                            className="input"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="например: Лаборант смены №3"
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
                            placeholder="user@ammophos.ru"
                            required
                        />
                    </label>

                    {mode === "create" && (
                        <label className="label">
                            Пароль
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <input
                                    className="input"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Пароль"
                                    required
                                    style={{ flex: 1 }}
                                />
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setPassword(generatePassword(12))}
                                    title="Сгенерировать пароль"
                                >
                                    🎲
                                </button>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setShowPassword((v) => !v)}
                                    title={showPassword ? "Скрыть" : "Показать"}
                                >
                                    {showPassword ? "🙈" : "👁️"}
                                </button>
                            </div>
                            <div className="small">Пароль будет показан администратору для передачи сотруднику.</div>
                        </label>
                    )}

                    <label className="label">
                        Роль
                        <select className="select" value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
                            <option value="LAB">LAB (Лаборант)</option>
                            <option value="QA">QA (Инженер качества)</option>
                            <option value="ADMIN">ADMIN (Администратор)</option>
                        </select>
                    </label>

                    <div style={{ marginTop: 2 }}>
                        <div className="small">Права для выбранной роли:</div>
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
