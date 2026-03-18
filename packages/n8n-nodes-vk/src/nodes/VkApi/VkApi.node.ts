import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from '../../n8n-shim';
import { NodeOperationError } from '../../n8n-shim';

import { normalizeOwnerId, randomId, vkRequest, type VkCredentials } from './transport';

const userFields = ['sex', 'bdate', 'city', 'contacts', 'domain', 'screen_name'].join(',');

export class VkApiNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VK API Pro',
		name: 'vkApiNode',
		icon: 'file:vk.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Пользователи, группы, стены, лайки, парсинг и чат-боты VK',
		defaults: { name: 'VK API Pro' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'vkApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{ name: 'User', value: 'user' },
					{ name: 'Group', value: 'group' },
					{ name: 'Wall', value: 'wall' },
					{ name: 'Like', value: 'like' },
					{ name: 'Bot', value: 'bot' },
				],
				default: 'user',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['user'] } },
				options: [
					{ name: 'Get User(s)', value: 'getUsers' },
					{ name: 'Search Users (Advanced)', value: 'searchUsers' },
				],
				default: 'getUsers',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['group'] } },
				options: [
					{ name: 'Search Groups', value: 'searchGroups' },
					{ name: 'Get Group By ID', value: 'getGroupById' },
					{ name: 'Get Group Admins', value: 'getGroupAdmins' },
				],
				default: 'searchGroups',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['wall'] } },
				options: [
					{ name: 'Get Posts', value: 'getPosts' },
					{ name: 'Create Post', value: 'createPost' },
				],
				default: 'getPosts',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['like'] } },
				options: [
					{ name: 'Get Likes', value: 'getLikes' },
					{ name: 'Add Like', value: 'addLike' },
				],
				default: 'getLikes',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['bot'] } },
				options: [
					{ name: 'Send Message', value: 'sendMessage' },
					{ name: 'Get Long Poll Server', value: 'getLongPollServer' },
				],
				default: 'sendMessage',
			},
			{
				displayName: 'IDs',
				name: 'userIds',
				type: 'string',
				displayOptions: { show: { resource: ['user'], operation: ['getUsers'] } },
				default: '',
				required: true,
				description: 'Список user_id или screen_name через запятую',
			},
			{
				displayName: 'Keyword Query',
				name: 'query',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['user', 'group'],
						operation: ['searchUsers', 'searchGroups'],
					},
				},
				default: '',
				required: true,
				description: 'Ключевая фраза для поиска',
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['user', 'group', 'wall', 'like'],
						operation: ['searchUsers', 'searchGroups', 'getPosts', 'getLikes', 'getGroupAdmins'],
					},
				},
				default: 20,
			},
			{
				displayName: 'City ID',
				name: 'cityId',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['user', 'group'],
						operation: ['searchUsers', 'searchGroups'],
					},
				},
				default: 0,
				description: '0 = не фильтровать. Узнать id можно через database.getCities',
			},
			{
				displayName: 'Sex',
				name: 'sex',
				type: 'options',
				displayOptions: { show: { resource: ['user'], operation: ['searchUsers'] } },
				options: [
					{ name: 'Any', value: 0 },
					{ name: 'Female', value: 1 },
					{ name: 'Male', value: 2 },
				],
				default: 0,
			},
			{
				displayName: 'Has Mobile Phone',
				name: 'hasMobile',
				type: 'boolean',
				displayOptions: { show: { resource: ['user'], operation: ['searchUsers'] } },
				default: false,
				description: 'Фильтр users.search -> has_mobile=1',
			},
			{
				displayName: 'Owner ID',
				name: 'ownerId',
				type: 'number',
				displayOptions: { show: { resource: ['wall', 'like'] } },
				default: 1,
				required: true,
			},
			{
				displayName: 'Is Group Owner',
				name: 'isGroupOwner',
				type: 'boolean',
				displayOptions: { show: { resource: ['wall', 'like'] } },
				default: false,
				description: 'Если true, owner_id преобразуется в отрицательный для группы',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				displayOptions: { show: { resource: ['wall'], operation: ['createPost'] } },
				default: '',
				required: true,
			},
			{
				displayName: 'Post ID',
				name: 'itemId',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['like'],
						operation: ['getLikes', 'addLike'],
					},
				},
				default: 1,
				required: true,
			},
			{
				displayName: 'Peer ID',
				name: 'peerId',
				type: 'number',
				displayOptions: { show: { resource: ['bot'], operation: ['sendMessage'] } },
				default: 0,
				required: true,
			},
			{
				displayName: 'Bot Text',
				name: 'botText',
				type: 'string',
				displayOptions: { show: { resource: ['bot'], operation: ['sendMessage'] } },
				default: '',
				required: true,
			},
			{
				displayName: 'Group ID',
				name: 'groupId',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['group', 'bot'],
						operation: ['getGroupById', 'getGroupAdmins', 'getLongPollServer'],
					},
				},
				default: 0,
				required: true,
				description: 'ID группы без знака минус',
			},
		],
	};

	private async executeUserOperation(
		ctx: IExecuteFunctions,
		index: number,
		operation: string,
		credentials: VkCredentials,
	): Promise<IDataObject> {
		if (operation === 'getUsers') {
			return await vkRequest(
				'users.get',
				{ user_ids: ctx.getNodeParameter('userIds', index) as string, fields: userFields },
				credentials,
			);
		}

		if (operation === 'searchUsers') {
			const cityId = ctx.getNodeParameter('cityId', index) as number;
			const hasMobile = ctx.getNodeParameter('hasMobile', index) as boolean;

			return await vkRequest(
				'users.search',
				{
					q: ctx.getNodeParameter('query', index) as string,
					count: ctx.getNodeParameter('count', index) as number,
					sex: ctx.getNodeParameter('sex', index) as number,
					city: cityId > 0 ? cityId : undefined,
					has_mobile: hasMobile ? 1 : undefined,
					fields: userFields,
				},
				credentials,
			);
		}

		throw new Error(`Неизвестная user-операция: ${operation}`);
	}

	private async executeGroupOperation(
		ctx: IExecuteFunctions,
		index: number,
		operation: string,
		credentials: VkCredentials,
	): Promise<IDataObject> {
		if (operation === 'searchGroups') {
			const cityId = ctx.getNodeParameter('cityId', index) as number;
			return await vkRequest(
				'groups.search',
				{
					q: ctx.getNodeParameter('query', index) as string,
					count: ctx.getNodeParameter('count', index) as number,
					city_id: cityId > 0 ? cityId : undefined,
					type: 'group,page,event',
					sort: 0,
				},
				credentials,
			);
		}

		if (operation === 'getGroupById') {
			return await vkRequest(
				'groups.getById',
				{
					group_id: ctx.getNodeParameter('groupId', index) as number,
					fields: ['city', 'contacts', 'description', 'members_count', 'site', 'verified'].join(','),
				},
				credentials,
			);
		}

		if (operation === 'getGroupAdmins') {
			return await vkRequest(
				'groups.getMembers',
				{
					group_id: ctx.getNodeParameter('groupId', index) as number,
					filter: 'managers',
					count: ctx.getNodeParameter('count', index) as number,
					fields: userFields,
				},
				credentials,
			);
		}

		throw new Error(`Неизвестная group-операция: ${operation}`);
	}

	private async executeWallOperation(
		ctx: IExecuteFunctions,
		index: number,
		operation: string,
		credentials: VkCredentials,
	): Promise<IDataObject> {
		const owner = normalizeOwnerId(
			ctx.getNodeParameter('ownerId', index) as number,
			ctx.getNodeParameter('isGroupOwner', index) as boolean,
		);

		if (operation === 'getPosts') {
			return await vkRequest(
				'wall.get',
				{ owner_id: owner, count: ctx.getNodeParameter('count', index) as number },
				credentials,
			);
		}

		if (operation === 'createPost') {
			return await vkRequest(
				'wall.post',
				{ owner_id: owner, message: ctx.getNodeParameter('message', index) as string },
				credentials,
			);
		}

		throw new Error(`Неизвестная wall-операция: ${operation}`);
	}

	private async executeLikeOperation(
		ctx: IExecuteFunctions,
		index: number,
		operation: string,
		credentials: VkCredentials,
	): Promise<IDataObject> {
		const owner = normalizeOwnerId(
			ctx.getNodeParameter('ownerId', index) as number,
			ctx.getNodeParameter('isGroupOwner', index) as boolean,
		);

		if (operation === 'getLikes') {
			return await vkRequest(
				'likes.getList',
				{
					type: 'post',
					owner_id: owner,
					item_id: ctx.getNodeParameter('itemId', index) as number,
					count: ctx.getNodeParameter('count', index) as number,
				},
				credentials,
			);
		}

		if (operation === 'addLike') {
			return await vkRequest(
				'likes.add',
				{ type: 'post', owner_id: owner, item_id: ctx.getNodeParameter('itemId', index) as number },
				credentials,
			);
		}

		throw new Error(`Неизвестная like-операция: ${operation}`);
	}

	private async executeBotOperation(
		ctx: IExecuteFunctions,
		index: number,
		operation: string,
		credentials: VkCredentials,
	): Promise<IDataObject> {
		if (operation === 'sendMessage') {
			return await vkRequest(
				'messages.send',
				{
					peer_id: ctx.getNodeParameter('peerId', index) as number,
					message: ctx.getNodeParameter('botText', index) as string,
					random_id: randomId(),
				},
				credentials,
			);
		}

		if (operation === 'getLongPollServer') {
			return await vkRequest(
				'groups.getLongPollServer',
				{ group_id: ctx.getNodeParameter('groupId', index) as number },
				credentials,
			);
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
				if (resource === 'user') {
					response = await this.executeUserOperation(this, index, operation, credentials);
				} else if (resource === 'group') {
					response = await this.executeGroupOperation(this, index, operation, credentials);
				} else if (resource === 'wall') {
					response = await this.executeWallOperation(this, index, operation, credentials);
				} else if (resource === 'like') {
					response = await this.executeLikeOperation(this, index, operation, credentials);
				} else if (resource === 'bot') {
					response = await this.executeBotOperation(this, index, operation, credentials);
				} else {
					throw new NodeOperationError(this.getNode(), `Неизвестный ресурс: ${resource}`);
				}

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
