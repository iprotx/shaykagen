import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from '../../n8n-shim';
import { NodeOperationError } from '../../n8n-shim';

import { dedupeByIdentity, enrichGroupItem, enrichUserItem, extractItems } from './parsing';
import { normalizeOwnerId, randomId, vkRequest, type RetryConfig, type VkCredentials } from './transport';

const userFields = ['sex', 'bdate', 'city', 'contacts', 'domain', 'screen_name'].join(',');
const groupFields = ['city', 'contacts', 'description', 'members_count', 'site', 'verified', 'screen_name'].join(',');

const optionalNumber = (value: number): number | undefined => (value > 0 ? value : undefined);

export class VkApiNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VKSUPERTOOL',
		name: 'vkSuperToolNode',
		icon: 'file:vk.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Пользователи, группы, справочники, стены, лайки, парсинг и чат-боты VK',
		defaults: { name: 'VKSUPERTOOL' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'vkApi', required: true }],
		properties: [
			{ displayName: 'Resource', name: 'resource', type: 'options', options: [
				{ name: 'User', value: 'user' },
				{ name: 'Group', value: 'group' },
				{ name: 'Reference', value: 'reference' },
				{ name: 'Wall', value: 'wall' },
				{ name: 'Like', value: 'like' },
				{ name: 'Bot', value: 'bot' },
			], default: 'user' },
			{ displayName: 'Operation', name: 'operation', type: 'options', displayOptions: { show: { resource: ['user'] } }, options: [
				{ name: 'Get User(s)', value: 'getUsers' },
				{ name: 'Search Users (Advanced)', value: 'searchUsers' },
			], default: 'getUsers' },
			{ displayName: 'Operation', name: 'operation', type: 'options', displayOptions: { show: { resource: ['group'] } }, options: [
				{ name: 'Search Groups', value: 'searchGroups' },
				{ name: 'Get Group By ID', value: 'getGroupById' },
				{ name: 'Get Group Admins', value: 'getGroupAdmins' },
				{ name: 'Get Group Members', value: 'getGroupMembers' },
			], default: 'searchGroups' },
			{ displayName: 'Operation', name: 'operation', type: 'options', displayOptions: { show: { resource: ['reference'] } }, options: [
				{ name: 'Search Cities', value: 'searchCities' },
				{ name: 'Resolve Screen Name', value: 'resolveScreenName' },
			], default: 'searchCities' },
			{ displayName: 'Operation', name: 'operation', type: 'options', displayOptions: { show: { resource: ['wall'] } }, options: [
				{ name: 'Get Posts', value: 'getPosts' },
				{ name: 'Create Post', value: 'createPost' },
			], default: 'getPosts' },
			{ displayName: 'Operation', name: 'operation', type: 'options', displayOptions: { show: { resource: ['like'] } }, options: [
				{ name: 'Get Likes', value: 'getLikes' },
				{ name: 'Add Like', value: 'addLike' },
			], default: 'getLikes' },
			{ displayName: 'Operation', name: 'operation', type: 'options', displayOptions: { show: { resource: ['bot'] } }, options: [
				{ name: 'Send Message', value: 'sendMessage' },
				{ name: 'Get Long Poll Server', value: 'getLongPollServer' },
			], default: 'sendMessage' },

			{ displayName: 'Keyword Query', name: 'query', type: 'string', displayOptions: { show: { resource: ['user', 'group', 'reference'], operation: ['searchUsers', 'searchGroups', 'searchCities', 'resolveScreenName'] } }, default: '', required: true },
			{ displayName: 'IDs', name: 'userIds', type: 'string', displayOptions: { show: { resource: ['user'], operation: ['getUsers'] } }, default: '', required: true },
			{ displayName: 'Count', name: 'count', type: 'number', displayOptions: { show: { resource: ['user', 'group', 'reference', 'wall', 'like'], operation: ['searchUsers', 'searchGroups', 'searchCities', 'getPosts', 'getLikes', 'getGroupAdmins', 'getGroupMembers'] } }, default: 20 },
			{ displayName: 'Offset', name: 'offset', type: 'number', displayOptions: { show: { resource: ['user', 'group', 'reference', 'wall', 'like'], operation: ['searchUsers', 'searchGroups', 'searchCities', 'getPosts', 'getLikes', 'getGroupAdmins', 'getGroupMembers'] } }, default: 0 },
			{ displayName: 'Batch Mode', name: 'batchMode', type: 'boolean', displayOptions: { show: { resource: ['user', 'group', 'reference', 'wall', 'like'], operation: ['searchUsers', 'searchGroups', 'searchCities', 'getPosts', 'getLikes', 'getGroupAdmins', 'getGroupMembers'] } }, default: false, description: 'Авто-пагинация до maxItems или пока данные не закончатся' },
			{ displayName: 'Max Items', name: 'maxItems', type: 'number', displayOptions: { show: { resource: ['user', 'group', 'reference', 'wall', 'like'], operation: ['searchUsers', 'searchGroups', 'searchCities', 'getPosts', 'getLikes', 'getGroupAdmins', 'getGroupMembers'], batchMode: [true] } }, default: 500 },
			{ displayName: 'Deduplicate', name: 'deduplicateResults', type: 'boolean', displayOptions: { show: { resource: ['user', 'group', 'reference'], operation: ['searchUsers', 'searchGroups', 'getGroupAdmins', 'getGroupMembers', 'searchCities'], batchMode: [true] } }, default: true },
			{ displayName: 'Enrich Results', name: 'enrichResults', type: 'boolean', displayOptions: { show: { resource: ['user', 'group'], operation: ['searchUsers', 'searchGroups', 'getGroupAdmins', 'getGroupMembers'] } }, default: true },
			{ displayName: 'Retry Max', name: 'retryMax', type: 'number', default: 2, description: 'Anti-rate-limit: число ретраев для 429/5xx и VK error 6/9/10' },
			{ displayName: 'Retry Base Delay (ms)', name: 'retryDelayMs', type: 'number', default: 350 },
			{ displayName: 'Retry Backoff Factor', name: 'retryBackoffFactor', type: 'number', default: 2 },

			{ displayName: 'City ID', name: 'cityId', type: 'number', displayOptions: { show: { resource: ['user', 'group'], operation: ['searchUsers', 'searchGroups'] } }, default: 0 },
			{ displayName: 'Country ID', name: 'countryId', type: 'number', displayOptions: { show: { resource: ['reference'], operation: ['searchCities'] } }, default: 1 },
			{ displayName: 'Sex', name: 'sex', type: 'options', displayOptions: { show: { resource: ['user'], operation: ['searchUsers'] } }, options: [
				{ name: 'Any', value: 0 }, { name: 'Female', value: 1 }, { name: 'Male', value: 2 },
			], default: 0 },
			{ displayName: 'Age From', name: 'ageFrom', type: 'number', displayOptions: { show: { resource: ['user'], operation: ['searchUsers'] } }, default: 0 },
			{ displayName: 'Age To', name: 'ageTo', type: 'number', displayOptions: { show: { resource: ['user'], operation: ['searchUsers'] } }, default: 0 },
			{ displayName: 'Has Mobile Phone', name: 'hasMobile', type: 'boolean', displayOptions: { show: { resource: ['user'], operation: ['searchUsers'] } }, default: false },
			{ displayName: 'Member Filter', name: 'memberFilter', type: 'options', displayOptions: { show: { resource: ['group'], operation: ['getGroupMembers'] } }, options: [
				{ name: 'All', value: 'all' }, { name: 'Friends', value: 'friends' }, { name: 'Managers (Admins)', value: 'managers' },
			], default: 'all' },

			{ displayName: 'Owner ID', name: 'ownerId', type: 'number', displayOptions: { show: { resource: ['wall', 'like'] } }, default: 1, required: true },
			{ displayName: 'Is Group Owner', name: 'isGroupOwner', type: 'boolean', displayOptions: { show: { resource: ['wall', 'like'] } }, default: false },
			{ displayName: 'Message', name: 'message', type: 'string', displayOptions: { show: { resource: ['wall'], operation: ['createPost'] } }, default: '', required: true },
			{ displayName: 'Post ID', name: 'itemId', type: 'number', displayOptions: { show: { resource: ['like'], operation: ['getLikes', 'addLike'] } }, default: 1, required: true },
			{ displayName: 'Peer ID', name: 'peerId', type: 'number', displayOptions: { show: { resource: ['bot'], operation: ['sendMessage'] } }, default: 0, required: true },
			{ displayName: 'Bot Text', name: 'botText', type: 'string', displayOptions: { show: { resource: ['bot'], operation: ['sendMessage'] } }, default: '', required: true },
			{ displayName: 'Group ID', name: 'groupId', type: 'number', displayOptions: { show: { resource: ['group', 'bot'], operation: ['getGroupById', 'getGroupAdmins', 'getGroupMembers', 'getLongPollServer'] } }, default: 0, required: true },
		],
	};

	private getRetryConfig(ctx: IExecuteFunctions, index: number): RetryConfig {
		return {
			maxRetries: ctx.getNodeParameter('retryMax', index) as number,
			baseDelayMs: ctx.getNodeParameter('retryDelayMs', index) as number,
			backoffFactor: ctx.getNodeParameter('retryBackoffFactor', index) as number,
		};
	}

	private async collectBatched(
		ctx: IExecuteFunctions,
		index: number,
		fetchPage: (offset: number, count: number) => Promise<IDataObject>,
	): Promise<IDataObject> {
		const batchMode = ctx.getNodeParameter('batchMode', index) as boolean;
		const count = ctx.getNodeParameter('count', index) as number;
		const offsetStart = ctx.getNodeParameter('offset', index) as number;
		if (!batchMode) return await fetchPage(offsetStart, count);

		const maxItems = ctx.getNodeParameter('maxItems', index) as number;
		let offset = offsetStart;
		let pages = 0;
		const aggregated: IDataObject[] = [];

		while (aggregated.length < maxItems) {
			const response = await fetchPage(offset, count);
			const items = extractItems(response);
			if (items.length === 0) break;
			aggregated.push(...items);
			if (items.length < count) break;
			offset += count;
			pages += 1;
		}

		return {
			items: aggregated.slice(0, maxItems),
			count: aggregated.length,
			batch: true,
			pagesFetched: pages + 1,
		};
	}

	private async enrichGroups(
		items: IDataObject[],
		credentials: VkCredentials,
		retry: RetryConfig,
	): Promise<IDataObject[]> {
		const ids = items.map((item) => item.id).filter((id): id is number => typeof id === 'number');
		if (ids.length === 0) return items.map(enrichGroupItem);

		const meta = await vkRequest('groups.getById', { group_ids: ids.join(','), fields: groupFields }, credentials, retry);
		const full = extractItems({ response: meta.response ?? meta }) as IDataObject[];
		const byId = new Map<number, IDataObject>();
		for (const item of full) {
			if (typeof item.id === 'number') byId.set(item.id, item);
		}
		return items.map((item) => {
			const extra = typeof item.id === 'number' ? byId.get(item.id) : undefined;
			return enrichGroupItem({ ...extra, ...item });
		});
	}

	private prepareFinalItems(
		ctx: IExecuteFunctions,
		index: number,
		items: IDataObject[],
		enricher?: (item: IDataObject) => IDataObject,
	): IDataObject[] {
		const dedupe = ctx.getNodeParameter('deduplicateResults', index, false) as boolean;
		const enrich = ctx.getNodeParameter('enrichResults', index, false) as boolean;
		let output = dedupe ? dedupeByIdentity(items) : items;
		if (enrich && enricher) output = output.map(enricher);
		return output;
	}

	private async executeUserOperation(ctx: IExecuteFunctions, index: number, operation: string, credentials: VkCredentials): Promise<IDataObject> {
		const retry = this.getRetryConfig(ctx, index);
		if (operation === 'getUsers') {
			return await vkRequest('users.get', { user_ids: ctx.getNodeParameter('userIds', index) as string, fields: userFields }, credentials, retry);
		}
		if (operation === 'searchUsers') {
			const cityId = ctx.getNodeParameter('cityId', index) as number;
			const hasMobile = ctx.getNodeParameter('hasMobile', index) as boolean;
			const response = await this.collectBatched(ctx, index, async (offset, count) =>
				await vkRequest('users.search', {
					q: ctx.getNodeParameter('query', index) as string, count, offset,
					sex: ctx.getNodeParameter('sex', index) as number,
					age_from: optionalNumber(ctx.getNodeParameter('ageFrom', index) as number),
					age_to: optionalNumber(ctx.getNodeParameter('ageTo', index) as number),
					city: optionalNumber(cityId), has_mobile: hasMobile ? 1 : undefined, fields: userFields,
				}, credentials, retry),
			);
			const items = extractItems(response);
			return { ...response, items: this.prepareFinalItems(ctx, index, items, enrichUserItem) };
		}
		throw new Error(`Неизвестная user-операция: ${operation}`);
	}

	private async executeGroupOperation(ctx: IExecuteFunctions, index: number, operation: string, credentials: VkCredentials): Promise<IDataObject> {
		const retry = this.getRetryConfig(ctx, index);
		if (operation === 'searchGroups') {
			const cityId = ctx.getNodeParameter('cityId', index) as number;
			const response = await this.collectBatched(ctx, index, async (offset, count) =>
				await vkRequest('groups.search', { q: ctx.getNodeParameter('query', index) as string, count, offset, city_id: optionalNumber(cityId), type: 'group,page,event', sort: 0 }, credentials, retry),
			);
			let items = extractItems(response);
			items = this.prepareFinalItems(ctx, index, items);
			if ((ctx.getNodeParameter('enrichResults', index, false) as boolean) && items.length > 0) {
				items = await this.enrichGroups(items, credentials, retry);
			}
			return { ...response, items };
		}
		if (operation === 'getGroupById') {
			return await vkRequest('groups.getById', { group_id: ctx.getNodeParameter('groupId', index) as number, fields: groupFields }, credentials, retry);
		}
		if (operation === 'getGroupAdmins' || operation === 'getGroupMembers') {
			const filter = operation === 'getGroupAdmins' ? 'managers' : (ctx.getNodeParameter('memberFilter', index) as string);
			const response = await this.collectBatched(ctx, index, async (offset, count) =>
				await vkRequest('groups.getMembers', { group_id: ctx.getNodeParameter('groupId', index) as number, filter: filter === 'all' ? undefined : filter, count, offset, fields: userFields }, credentials, retry),
			);
			const items = this.prepareFinalItems(ctx, index, extractItems(response), enrichUserItem);
			return { ...response, items };
		}
		throw new Error(`Неизвестная group-операция: ${operation}`);
	}

	private async executeReferenceOperation(ctx: IExecuteFunctions, index: number, operation: string, credentials: VkCredentials): Promise<IDataObject> {
		const retry = this.getRetryConfig(ctx, index);
		if (operation === 'searchCities') {
			const response = await this.collectBatched(ctx, index, async (offset, count) =>
				await vkRequest('database.getCities', { country_id: ctx.getNodeParameter('countryId', index) as number, q: ctx.getNodeParameter('query', index) as string, need_all: 1, count, offset }, credentials, retry),
			);
			const items = this.prepareFinalItems(ctx, index, extractItems(response));
			return { ...response, items };
		}
		if (operation === 'resolveScreenName') {
			return await vkRequest('utils.resolveScreenName', { screen_name: ctx.getNodeParameter('query', index) as string }, credentials, retry);
		}
		throw new Error(`Неизвестная reference-операция: ${operation}`);
	}

	private async executeWallOperation(ctx: IExecuteFunctions, index: number, operation: string, credentials: VkCredentials): Promise<IDataObject> {
		const retry = this.getRetryConfig(ctx, index);
		const owner = normalizeOwnerId(ctx.getNodeParameter('ownerId', index) as number, ctx.getNodeParameter('isGroupOwner', index) as boolean);
		if (operation === 'getPosts') {
			return await this.collectBatched(ctx, index, async (offset, count) =>
				await vkRequest('wall.get', { owner_id: owner, count, offset }, credentials, retry),
			);
		}
		if (operation === 'createPost') {
			return await vkRequest('wall.post', { owner_id: owner, message: ctx.getNodeParameter('message', index) as string }, credentials, retry);
		}
		throw new Error(`Неизвестная wall-операция: ${operation}`);
	}

	private async executeLikeOperation(ctx: IExecuteFunctions, index: number, operation: string, credentials: VkCredentials): Promise<IDataObject> {
		const retry = this.getRetryConfig(ctx, index);
		const owner = normalizeOwnerId(ctx.getNodeParameter('ownerId', index) as number, ctx.getNodeParameter('isGroupOwner', index) as boolean);
		if (operation === 'getLikes') {
			return await this.collectBatched(ctx, index, async (offset, count) =>
				await vkRequest('likes.getList', { type: 'post', owner_id: owner, item_id: ctx.getNodeParameter('itemId', index) as number, count, offset }, credentials, retry),
			);
		}
		if (operation === 'addLike') {
			return await vkRequest('likes.add', { type: 'post', owner_id: owner, item_id: ctx.getNodeParameter('itemId', index) as number }, credentials, retry);
		}
		throw new Error(`Неизвестная like-операция: ${operation}`);
	}

	private async executeBotOperation(ctx: IExecuteFunctions, index: number, operation: string, credentials: VkCredentials): Promise<IDataObject> {
		const retry = this.getRetryConfig(ctx, index);
		if (operation === 'sendMessage') {
			return await vkRequest('messages.send', { peer_id: ctx.getNodeParameter('peerId', index) as number, message: ctx.getNodeParameter('botText', index) as string, random_id: randomId() }, credentials, retry);
		}
		if (operation === 'getLongPollServer') {
			return await vkRequest('groups.getLongPollServer', { group_id: ctx.getNodeParameter('groupId', index) as number }, credentials, retry);
		}
		throw new Error(`Неизвестная bot-операция: ${operation}`);
	}

	async execute(this: IExecuteFunctions & VkApiNode): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = (await this.getCredentials('vkApi')) as VkCredentials;

		for (let index = 0; index < items.length; index++) {
			try {
				const resource = this.getNodeParameter('resource', index) as string;
				const operation = this.getNodeParameter('operation', index) as string;

				let response: IDataObject;
				if (resource === 'user') response = await this.executeUserOperation(this, index, operation, credentials);
				else if (resource === 'group') response = await this.executeGroupOperation(this, index, operation, credentials);
				else if (resource === 'reference') response = await this.executeReferenceOperation(this, index, operation, credentials);
				else if (resource === 'wall') response = await this.executeWallOperation(this, index, operation, credentials);
				else if (resource === 'like') response = await this.executeLikeOperation(this, index, operation, credentials);
				else if (resource === 'bot') response = await this.executeBotOperation(this, index, operation, credentials);
				else throw new NodeOperationError(this.getNode(), `Неизвестный ресурс: ${resource}`);

				returnData.push({ json: response, pairedItem: { item: index } });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message, itemIndex: index }, pairedItem: { item: index } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
