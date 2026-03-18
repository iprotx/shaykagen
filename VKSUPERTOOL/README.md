# VKSUPERTOOL

Отдельный репозиторий community-ноды n8n для VK API.

## Что делает

- Bulk parsing (auto-pagination) через `Batch Mode` + `Max Items`.
- Dedup + enrichment pipeline для users/groups.
- Retry/backoff anti-rate-limit.
- Готовые workflow templates: поиск ЦА, конкурентный мониторинг, бот-прогрев.

## Архитектура

- `src/nodes/VkApi/VkApi.node.ts` — orchestration и маршрутизация операций.
- `src/nodes/VkApi/transport.ts` — HTTP/VK транспорт и retry.
- `src/nodes/VkApi/parsing.ts` — parsing/dedup/enrichment.
- `src/credentials/VkApi.credentials.ts` — credentials.
- `ARCHITECTURE_REVIEW.md` — аудит связанности и рекомендаций.

## Проверка и сборка

```bash
cd VKSUPERTOOL
tsc -p tsconfig.json --noEmit
node --test --experimental-strip-types test/**/*.test.ts
tsc -p tsconfig.json && cp src/nodes/VkApi/vk.svg dist/nodes/VkApi/vk.svg
npm pack --pack-destination release
```

## Установка в n8n

```bash
npm install ./n8n-nodes-vksupertool-0.1.0.tgz
```
