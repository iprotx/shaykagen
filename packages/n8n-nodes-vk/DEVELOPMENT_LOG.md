# Development Log

## Этап 1 — Архитектура
- Создан отдельный пакет `packages/n8n-nodes-vk`.
- Выбрана модульная структура: credentials, node description, transport.

## Этап 2 — Credentials и транспорт
- Реализованы `VkApi.credentials.ts` и `transport.ts`.
- Добавлена единая функция `vkRequest` с обработкой HTTP/API ошибок.

## Этап 3 — Расширение API для парсинга
- Добавлен ресурс `Group`:
  - `groups.search` (ключевые слова + `city_id` + `offset`)
  - `groups.getById`
  - `groups.getMembers` с `filter=managers` (админы/менеджеры)
  - `groups.getMembers` (all/friends/managers)
- Расширен `users.search`:
  - фильтр по полу (`sex`)
  - фильтр по городу (`city`)
  - фильтр по мобильному телефону (`has_mobile`)
  - фильтр по возрасту (`age_from/age_to`)

## Этап 4 — Справочники и нормализация
- Добавлен ресурс `Reference`:
  - `database.getCities` (поиск `city_id`)
  - `utils.resolveScreenName` (преобразование коротких ссылок)

## Этап 5 — Рефакторинг и документация
- Логика разбита на `execute*Operation` функции по ресурсам.
- README и market research документированы по практическим сценариям.

## Этап 6 — Тестирование
- Проверка типов, тесты и сборка выполнены.
