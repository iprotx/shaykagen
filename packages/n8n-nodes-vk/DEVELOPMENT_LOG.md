# Development Log

## Этап 1 — Bulk mode
- Добавлен `Batch Mode` с авто-пагинацией до `Max Items` или исчерпания выдачи.
- Реализован loop-until-empty / loop-until-limit для users/groups/reference/wall/likes.

## Этап 2 — Дедупликация и enrichment
- Добавлен parsing pipeline:
  - `dedupeByIdentity`
  - `enrichUserItem`
  - `enrichGroupItem`
- Для `groups.search` добавлено обогащение метаданными через `groups.getById`.

## Этап 3 — Anti-rate-limit
- В transport реализован retry/backoff policy:
  - HTTP: 429, 5xx
  - VK API: error 6/9/10
- Выведены нодовые параметры: `Retry Max`, `Retry Base Delay`, `Retry Backoff Factor`.

## Этап 4 — Workflow templates
- Добавлены шаблоны:
  - поиск ЦА
  - конкурентный мониторинг
  - бот-прогрев

## Этап 5 — Тестирование
- Добавлены unit-тесты для parsing helpers.
- Выполнены typecheck, тесты и сборка пакета.
