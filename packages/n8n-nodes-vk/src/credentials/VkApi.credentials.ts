import type { ICredentialType, INodeProperties } from '../n8n-shim';

export class VkApi implements ICredentialType {
	name = 'vkApi';
	displayName = 'VK API';
	documentationUrl = 'https://dev.vk.com/reference';
	properties: INodeProperties[] = [
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Service token, user token или group token с нужными правами',
		},
		{
			displayName: 'API Version',
			name: 'apiVersion',
			type: 'string',
			default: '5.199',
			required: true,
			description: 'Версия VK API (параметр v)',
		},
		{
			displayName: 'API URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.vk.com/method',
			required: true,
			description: 'Базовый URL VK API',
		},
	];
}
