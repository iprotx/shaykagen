# Development Log

## Этап 1 — Вынос в отдельный репозиторий
- Пакет полностью вынесен из `packages/` в корень `VKSUPERTOOL/`.
- Брендинг и имя пакета переименованы в `VKSUPERTOOL` / `n8n-nodes-vksupertool`.

## Этап 2 — Проверка архитектуры
- Выполнен review связанности модулей (`ARCHITECTURE_REVIEW.md`).
- Подтверждено разделение слоёв: orchestration / transport / parsing / credentials.

## Этап 3 — Сборка артефакта
- Проведены typecheck + tests + build.
- Сформирован release tarball для установки в n8n.
