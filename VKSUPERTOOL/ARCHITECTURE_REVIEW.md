# VKSUPERTOOL Architecture Review

## Статус

Проверена связанность модулей и разделение ответственности после выноса в отдельный репозиторий.

## Архитектурные слои

1. **Node orchestration**: `src/nodes/VkApi/VkApi.node.ts`
   - Управляет routing по ресурсам/операциям.
   - Конфигурирует batch/retry/enrichment/dedup параметры.

2. **Transport layer**: `src/nodes/VkApi/transport.ts`
   - Единая точка HTTP + VK API ошибок.
   - Retry/backoff для rate-limit и нестабильных ответов.

3. **Parsing pipeline**: `src/nodes/VkApi/parsing.ts`
   - Извлечение `items`.
   - Дедупликация и enrichment-нормализация.

4. **Credentials**: `src/credentials/VkApi.credentials.ts`
   - Отделены от бизнес-логики.

## Связанность и модульность

- Связанность высокая внутри каждого слоя и низкая между слоями.
- `VkApi.node.ts` зависит только от чистых API `transport/parsing`.
- Transport не зависит от node runtime, только от входных параметров.

## Риски

1. Файл `VkApi.node.ts` остаётся крупным и может быть разделён по ресурсам (`user/group/reference/wall/...`).
2. Для enterprise-нагрузки стоит добавить circuit-breaker и jitter к backoff.
3. Рекомендуется заменить shim на официальный `n8n-workflow` при публикации.

## Рекомендации

- Следующий шаг: вынести операции каждого ресурса в отдельные модули `operations/*.ts`.
- Добавить интеграционные e2e тесты на моках VK API.
- Добавить CI release pipeline: lint -> test -> build -> pack -> checksum.
