# Development Log

## Этап 1 — Архитектура
- Создан отдельный пакет `packages/n8n-nodes-vk`.
- Выбрана модульная структура: credentials, node description, transport.

## Этап 2 — Credentials и транспорт
- Реализованы `VkApi.credentials.ts` и `transport.ts`.
- Добавлена единая функция `vkRequest` с обработкой HTTP/API ошибок.

## Этап 3 — Основные операции
- User: `users.get`, `users.search`.
- Wall: `wall.get`, `wall.post`.
- Like: `likes.getList`, `likes.add`.
- Bot: `messages.send`, `groups.getLongPollServer`.

## Этап 4 — Тестирование
- Написаны unit-тесты helper-функций (`normalizeOwnerId`, `buildQuery`, `randomId`).
- Выполнены `lint`, `test`, `build`.

## Этап 5 — Документация
- Добавлены `README.md` (установка + сценарии + debug).
- Этот лог фиксирует прогресс и точки дебага каждого шага.
