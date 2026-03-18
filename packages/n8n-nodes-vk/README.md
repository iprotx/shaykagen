# n8n-nodes-vk-pro

Многофункциональная community-нода для n8n и VK API (dev.vk.com).

## Что реализовано

- Авторизация через `Credentials` (`access_token`, `v`, `baseUrl`).
- Пользователи:
  - `users.get`
  - `users.search` с фильтрами по полу, возрасту, городу, наличию мобильного телефона (`has_mobile`)
- Группы/сообщества:
  - `groups.search` с фильтрацией по ключевым словам и `city_id`
  - `groups.getById` для обогащения карточки сообщества
  - `groups.getMembers` с `filter=managers` для парсинга админов/менеджеров
  - `groups.getMembers` с режимами `all/friends/managers`
- Справочники:
  - `database.getCities` (поиск city_id по названию)
  - `utils.resolveScreenName` (нормализация screen_name в object/id)
- Контент и вовлеченность:
  - `wall.get`
  - `wall.post`
  - `likes.getList`
  - `likes.add`
- Боты:
  - `messages.send`
  - `groups.getLongPollServer`

## Плюсы для парсинга

- Единый параметр `offset` для пагинации в ключевых парсинговых операциях.
- Удобный сценарий: `searchCities -> searchGroups/searchUsers -> getGroupAdmins/getGroupMembers`.
- Поля `contacts/city/screen_name` сразу возвращаются в поиске пользователей.

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
   - Введите `Keyword Query`, `City ID`, `Count`, `Offset`

2. **Получение админов найденной группы**
   - Resource: `Group`
   - Operation: `Get Group Admins`
   - Введите `Group ID`, `Count`, `Offset`

3. **Поиск пользователей ЦА**
   - Resource: `User`
   - Operation: `Search Users (Advanced)`
   - Введите ключевое слово, `Sex`, `Age`, `City ID`, `Has Mobile Phone`

4. **Нормализация ссылок / city_id**
   - Resource: `Reference`
   - `Resolve Screen Name` и `Search Cities`

5. **Публикация и анализ вовлеченности**
   - `Wall -> Create Post`
   - `Like -> Get Likes`

## Маркетинг-исследование

См. `MARKET_RESEARCH_2026.md` — обзор рынка VK-парсеров, трендов и рекомендаций.

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
