# n8n-nodes-vk-pro

Многофункциональная community-нода для n8n и VK API (dev.vk.com).

## Что нового в этой версии

- ✅ **Bulk-parsing (batched mode)**: авто-пагинация до лимита `Max Items` или до конца выдачи.
- ✅ **Dedup pipeline**: удаление дублей по `id/screen_name/domain`.
- ✅ **Enrichment pipeline**:
  - users: `screen_name_url`, `city_title`
  - groups: дополнительное обогащение через `groups.getById` и нормализация полей
- ✅ **Anti-rate-limit**: retry/backoff стратегия (HTTP 429/5xx, VK error 6/9/10).
- ✅ **Workflow templates**: готовые JSON-шаблоны под поиск ЦА, мониторинг конкурентов и бот-прогрев.

## Основные операции

- Users: `users.get`, `users.search`
- Groups: `groups.search`, `groups.getById`, `groups.getMembers` (`managers/all/friends`)
- Reference: `database.getCities`, `utils.resolveScreenName`
- Wall: `wall.get`, `wall.post`
- Likes: `likes.getList`, `likes.add`
- Bot: `messages.send`, `groups.getLongPollServer`

## Параметры production-парсинга

- `Batch Mode`: включает loop-until-empty / loop-until-max-items.
- `Max Items`: верхний лимит объёма данных на одну ноду.
- `Deduplicate`: чистка дублей.
- `Enrich Results`: обогащение профилей/групп.
- `Retry Max`, `Retry Base Delay`, `Retry Backoff Factor`: anti-rate-limit параметры.

## Готовые workflow templates

Папка: `workflow-templates/`

1. `01-target-audience-search.json` — поиск ЦА.
2. `02-competitor-monitoring.json` — мониторинг конкурентов.
3. `03-bot-warmup.json` — бот-прогрев.

## Установка и проверка

```bash
cd packages/n8n-nodes-vk
tsc -p tsconfig.json --noEmit
node --test --experimental-strip-types test/**/*.test.ts
tsc -p tsconfig.json && cp src/nodes/VkApi/vk.svg dist/nodes/VkApi/vk.svg
```
