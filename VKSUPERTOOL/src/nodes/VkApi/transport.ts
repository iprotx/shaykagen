import type { IDataObject } from '../../n8n-shim';

export interface VkCredentials {
	accessToken: string;
	apiVersion: string;
	baseUrl: string;
}

export interface RetryConfig {
	maxRetries: number;
	baseDelayMs: number;
	backoffFactor: number;
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

const sleep = async (ms: number): Promise<void> => await new Promise((resolve) => setTimeout(resolve, ms));

const isRetriableStatus = (status: number): boolean => status === 429 || status >= 500;
const isRetriableVkError = (errorCode: number): boolean => errorCode === 6 || errorCode === 9 || errorCode === 10;

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
	retryConfig?: RetryConfig,
): Promise<IDataObject> => {
	const cfg: RetryConfig = retryConfig ?? { maxRetries: 0, baseDelayMs: 350, backoffFactor: 2 };
	let attempt = 0;

	while (attempt <= cfg.maxRetries) {
		const query = buildQuery(params, credentials);
		const endpoint = `${credentials.baseUrl}/${method}`;
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: query.toString(),
		});

		if (!response.ok) {
			if (attempt < cfg.maxRetries && isRetriableStatus(response.status)) {
				const delay = Math.round(cfg.baseDelayMs * cfg.backoffFactor ** attempt);
				await sleep(delay);
				attempt += 1;
				continue;
			}
			throw new Error(`VK HTTP error: ${response.status} ${response.statusText}`);
		}

		const payload = (await response.json()) as VkApiSuccess | VkApiError;
		if ('error' in payload) {
			if (attempt < cfg.maxRetries && isRetriableVkError(payload.error.error_code)) {
				const delay = Math.round(cfg.baseDelayMs * cfg.backoffFactor ** attempt);
				await sleep(delay);
				attempt += 1;
				continue;
			}
			throw new Error(`VK API error ${payload.error.error_code}: ${payload.error.error_msg}`);
		}

		return payload.response;
	}

	throw new Error('VK request retries exceeded');
};
