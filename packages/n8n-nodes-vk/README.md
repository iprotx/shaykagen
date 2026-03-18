# n8n-nodes-vk-pro

Многофункциональная community-нода для n8n и VK API (dev.vk.com).

## Что реализовано

- Авторизация через `Credentials` (`access_token`, `v`, `baseUrl`).
- Работа с пользователями:
  - `users.get`
  - `users.search`
- Парсинг данных со стены:
  - `wall.get`
  - `wall.post`
- Работа с лайками:
  - `likes.getList`
  - `likes.add`
- Базовые функции чат-бота:
  - `messages.send`
  - `groups.getLongPollServer`

## Установка в n8n (локально)

```bash
cd packages/n8n-nodes-vk
npm install
npm run build
```

Далее подключите пакет как community node в n8n.

## Отладка

1. Проверить compile-time типы:

```bash
npm run lint
```

2. Проверить unit-тесты helper-функций:

```bash
npm run test
```

3. Проверить сборку для n8n:

```bash
npm run build
```

## Пример сценариев

1. **Поиск пользователей по интересам**: `User -> Search Users`.
2. **Мониторинг вовлеченности поста**: `Like -> Get Likes` по `owner_id + post_id`.
3. **Постинг в сообщество**: `Wall -> Create Post` с `isGroupOwner=true`.
4. **Чат-бот**: триггер + `Bot -> Send Message`.

## Ограничения и roadmap

- Пока реализованы только ключевые операции; API легко расширяется новыми методами.
- Для production-ботов рекомендуются retry/backoff и анти-flood контроль на уровне workflow.
