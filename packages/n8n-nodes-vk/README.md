# n8n-nodes-vk-pro

Многофункциональная community-нода для n8n и VK API (dev.vk.com).

## Что реализовано

- Авторизация через `Credentials` (`access_token`, `v`, `baseUrl`).
- Пользователи:
  - `users.get`
  - `users.search` с фильтрами по полу, городу, наличию мобильного телефона (`has_mobile`)
- Группы/сообщества:
  - `groups.search` с фильтрацией по ключевым словам и `city_id`
  - `groups.getById` для обогащения карточки сообщества
  - `groups.getMembers` с `filter=managers` для парсинга админов/менеджеров
- Контент и вовлеченность:
  - `wall.get`
  - `wall.post`
  - `likes.getList`
  - `likes.add`
- Боты:
  - `messages.send`
  - `groups.getLongPollServer`

## Установка в n8n (локально)

```bash
cd packages/n8n-nodes-vk
npm run lint
npm run test
npm run build
```

Далее подключите пакет как community node в n8n.

## Практические сценарии парсинга

1. **Поиск сообществ по нише и городу**
   - Resource: `Group`
   - Operation: `Search Groups`
   - Введите `Keyword Query`, `City ID`, `Count`

2. **Получение админов найденной группы**
   - Resource: `Group`
   - Operation: `Get Group Admins`
   - Введите `Group ID`

3. **Поиск пользователей ЦА**
   - Resource: `User`
   - Operation: `Search Users (Advanced)`
   - Введите ключевое слово, `Sex`, `City ID`, `Has Mobile Phone`

4. **Публикация и анализ вовлеченности**
   - `Wall -> Create Post`
   - `Like -> Get Likes`

## Дебаг каждого этапа

1. Проверка типов

```bash
../../node_modules/.bin/tsc -p tsconfig.json --noEmit
```

2. Тесты helper-логики

```bash
node --test --experimental-strip-types test/**/*.test.ts
```

3. Сборка ноды

```bash
../../node_modules/.bin/tsc -p tsconfig.json && cp src/nodes/VkApi/vk.svg dist/nodes/VkApi/vk.svg
```
