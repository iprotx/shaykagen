import test from 'node:test';
import assert from 'node:assert/strict';

import { dedupeByIdentity, enrichUserItem, extractItems } from '../src/nodes/VkApi/parsing.ts';

test('extractItems берет items из ответа', () => {
	const items = extractItems({ items: [{ id: 1 }, { id: 2 }] });
	assert.equal(items.length, 2);
});

test('dedupeByIdentity удаляет дубли по id и screen_name', () => {
	const result = dedupeByIdentity([
		{ id: 1, screen_name: 'a' },
		{ id: 1, screen_name: 'a' },
		{ screen_name: 'b' },
		{ screen_name: 'b' },
	]);
	assert.equal(result.length, 2);
});

test('enrichUserItem добавляет city_title и ссылку', () => {
	const enriched = enrichUserItem({ screen_name: 'durov', city: { title: 'СПб' } });
	assert.equal(enriched.city_title, 'СПб');
	assert.equal(enriched.screen_name_url, 'https://vk.com/durov');
});
