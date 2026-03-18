import type { IDataObject } from '../../n8n-shim';

export interface VkCredentials {
	accessToken: string;
	apiVersion: string;
	baseUrl: string;
}

export interface VkApiSuccess {
	response: IDataObject;
}

export interface VkApiError {
	error: {
		error_code: number;
		error_msg: string;
		request_params?: Array<{ key: string; value: string }>;
	};
}

export const randomId = (): number => {
	const now = Date.now();
	const rand = Math.floor(Math.random() * 100_000);
	return Number(`${now}${rand}`.slice(-9));
};

export const normalizeOwnerId = (ownerId: number, isGroup: boolean): number => {
	if (!isGroup) return ownerId;
	return ownerId > 0 ? -ownerId : ownerId;
};

export const buildQuery = (
	params: IDataObject,
	credentials: VkCredentials,
): URLSearchParams => {
	const query = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null || value === '') continue;
		query.append(key, String(value));
	}

	query.append('access_token', credentials.accessToken);
	query.append('v', credentials.apiVersion);

	return query;
};

export const vkRequest = async (
	method: string,
	params: IDataObject,
	credentials: VkCredentials,
): Promise<IDataObject> => {
	const query = buildQuery(params, credentials);
	const endpoint = `${credentials.baseUrl}/${method}`;
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: query.toString(),
	});

	if (!response.ok) {
		throw new Error(`VK HTTP error: ${response.status} ${response.statusText}`);
	}

	const payload = (await response.json()) as VkApiSuccess | VkApiError;
	if ('error' in payload) {
		throw new Error(`VK API error ${payload.error.error_code}: ${payload.error.error_msg}`);
	}

	return payload.response;
};
