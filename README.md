# LabQuality

Веб-приложение для автоматизации сбора и первичного анализа лабораторных данных о качестве продукции предприятия Аммофос.

Система позволяет создавать партии продукции, импортировать CSV-файлы с измерениями, сравнивать показатели с нормативами и автоматически определять статус партии: `OK`, `WARNING` или `FAIL`.

## Стек

- Backend: Kotlin, Spring Boot, Spring Security, Spring Data JPA
- Frontend: React, TypeScript
- База данных: PostgreSQL
- Авторизация: JWT

## Структура

- `backend` - серверная часть, REST API, бизнес-логика, работа с PostgreSQL.
- `frontend` - клиентская часть, страницы авторизации, партий, импорта и анализа.
- `backend/src/main/resources/db/migration` - SQL-скрипты создания и заполнения БД.
- `import_samples` - готовые CSV-файлы для проверки импорта.
- `docs` - дополнительные материалы, включая ER-модель.

## База данных

По умолчанию backend подключается к PostgreSQL:

```text
url: jdbc:postgresql://localhost:5432/postgres
user: postgres
password: 123
```

Параметры можно переопределить переменными окружения:

```text
DB_URL
DB_USER
DB_PASSWORD
JWT_SECRET
```

Основные таблицы:

- `users` - пользователи и роли.
- `products` - продукция предприятия.
- `metrics` - показатели качества.
- `norms` - нормы показателей для каждого продукта.
- `batches` - партии продукции.
- `measurements` - импортированные лабораторные измерения.

## Запуск

Backend:

```bash
cd backend
./gradlew bootRun
```

Frontend:

```bash
cd frontend
npm install
npm start
```

После запуска:

- frontend: `http://localhost:3000`
- backend API: `http://localhost:8080`

## Учетные записи

- Администратор: `admin@example.com` / `admin123`
- Инженер ОТК: `qa@example.com` / `qa123`
- Лаборант: `lab1@example.com` / `lab123`
- Лаборант: `lab2@example.com` / `lab123`

## Проверка импорта

1. Войти в систему.
2. Создать новую партию и выбрать продукт.
3. Открыть страницу партии.
4. Загрузить CSV-файл из папки `import_samples`.
5. Проверить таблицу первичного анализа и итоговый статус партии.

Ожидаемые результаты:

- `ammophos_np_1252_ok.csv` - статус `OK`.
- `ammophos_np_1252_warning.csv` - статус `WARNING`.
- `ammophos_np_1252_fail.csv` - статус `FAIL`.
- `npk_16_16_16_ok.csv` - статус `OK`.
- `npk_16_16_16_warning.csv` - статус `WARNING`.
- `npk_16_16_16_fail.csv` - статус `FAIL`.

## Проверка перед сдачей

Backend:

```bash
cd backend
./gradlew test
```

Frontend:

```bash
cd frontend
npm test -- --watchAll=false --passWithNoTests
npm run build
```
