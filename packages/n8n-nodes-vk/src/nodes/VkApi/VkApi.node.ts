import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from '../../n8n-shim';
import { NodeOperationError } from '../../n8n-shim';

import { normalizeOwnerId, randomId, vkRequest, type VkCredentials } from './transport';

export class VkApiNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VK API Pro',
		name: 'vkApiNode',
		icon: 'file:vk.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Пользователи, стены, лайки, группы и чат-боты VK',
		defaults: {
			name: 'VK API Pro',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'vkApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{ name: 'User', value: 'user' },
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
					{ name: 'Search Users', value: 'searchUsers' },
				],
				default: 'getUsers',
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
				description: 'Список user_id через запятую',
				required: true,
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				displayOptions: { show: { resource: ['user'], operation: ['searchUsers'] } },
				default: '',
				required: true,
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
				description: 'Если true, owner_id будет преобразован в отрицательный для группы',
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['user', 'wall', 'like'],
						operation: ['searchUsers', 'getPosts', 'getLikes'],
					},
				},
				default: 20,
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
				displayOptions: { show: { resource: ['bot'], operation: ['getLongPollServer'] } },
				default: 0,
				required: true,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = (await this.getCredentials('vkApi')) as unknown as VkCredentials;

		for (let index = 0; index < items.length; index++) {
			try {
				const resource = this.getNodeParameter('resource', index) as string;
				const operation = this.getNodeParameter('operation', index) as string;

				let response: IDataObject;
				if (resource === 'user' && operation === 'getUsers') {
					response = await vkRequest(
						'users.get',
						{ user_ids: this.getNodeParameter('userIds', index) as string },
						credentials,
					);
				} else if (resource === 'user' && operation === 'searchUsers') {
					response = await vkRequest(
						'users.search',
						{
							q: this.getNodeParameter('query', index) as string,
							count: this.getNodeParameter('count', index) as number,
						},
						credentials,
					);
				} else if (resource === 'wall' && operation === 'getPosts') {
					const owner = normalizeOwnerId(
						this.getNodeParameter('ownerId', index) as number,
						this.getNodeParameter('isGroupOwner', index) as boolean,
					);
					response = await vkRequest(
						'wall.get',
						{ owner_id: owner, count: this.getNodeParameter('count', index) as number },
						credentials,
					);
				} else if (resource === 'wall' && operation === 'createPost') {
					const owner = normalizeOwnerId(
						this.getNodeParameter('ownerId', index) as number,
						this.getNodeParameter('isGroupOwner', index) as boolean,
					);
					response = await vkRequest(
						'wall.post',
						{ owner_id: owner, message: this.getNodeParameter('message', index) as string },
						credentials,
					);
				} else if (resource === 'like' && operation === 'getLikes') {
					const owner = normalizeOwnerId(
						this.getNodeParameter('ownerId', index) as number,
						this.getNodeParameter('isGroupOwner', index) as boolean,
					);
					response = await vkRequest(
						'likes.getList',
						{
							type: 'post',
							owner_id: owner,
							item_id: this.getNodeParameter('itemId', index) as number,
							count: this.getNodeParameter('count', index) as number,
						},
						credentials,
					);
				} else if (resource === 'like' && operation === 'addLike') {
					const owner = normalizeOwnerId(
						this.getNodeParameter('ownerId', index) as number,
						this.getNodeParameter('isGroupOwner', index) as boolean,
					);
					response = await vkRequest(
						'likes.add',
						{ type: 'post', owner_id: owner, item_id: this.getNodeParameter('itemId', index) as number },
						credentials,
					);
				} else if (resource === 'bot' && operation === 'sendMessage') {
					response = await vkRequest(
						'messages.send',
						{
							peer_id: this.getNodeParameter('peerId', index) as number,
							message: this.getNodeParameter('botText', index) as string,
							random_id: randomId(),
						},
						credentials,
					);
				} else if (resource === 'bot' && operation === 'getLongPollServer') {
					response = await vkRequest(
						'groups.getLongPollServer',
						{ group_id: this.getNodeParameter('groupId', index) as number },
						credentials,
					);
				} else {
					throw new NodeOperationError(this.getNode(), `Неизвестная операция: ${resource}.${operation}`);
				}

				returnData.push({ json: response, pairedItem: { item: index } });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
							itemIndex: index,
						},
						pairedItem: { item: index },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
