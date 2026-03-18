import test from 'node:test';
import assert from 'node:assert/strict';

import { buildQuery, normalizeOwnerId, randomId } from '../src/nodes/VkApi/transport.ts';

test('normalizeOwnerId делает id группы отрицательным', () => {
	assert.equal(normalizeOwnerId(123, true), -123);
	assert.equal(normalizeOwnerId(-123, true), -123);
	assert.equal(normalizeOwnerId(123, false), 123);
});

test('buildQuery добавляет токен и версию API', () => {
	const query = buildQuery(
		{ owner_id: -1, message: 'hello' },
		{ accessToken: 'token', apiVersion: '5.199', baseUrl: 'https://api.vk.com/method' },
	);

	assert.equal(query.get('owner_id'), '-1');
	assert.equal(query.get('message'), 'hello');
	assert.equal(query.get('access_token'), 'token');
	assert.equal(query.get('v'), '5.199');
});

test('randomId возвращает положительное число', () => {
	const id = randomId();
	assert.equal(Number.isInteger(id), true);
	assert.equal(id > 0, true);
});
