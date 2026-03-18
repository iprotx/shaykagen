import type { IDataObject } from '../../n8n-shim';

export interface BatchConfig {
	enabled: boolean;
	maxItems: number;
	countPerRequest: number;
	startOffset: number;
}

const asRecord = (value: unknown): IDataObject => (typeof value === 'object' && value !== null ? (value as IDataObject) : {});

const asString = (value: unknown): string | undefined => (typeof value === 'string' && value.trim().length > 0 ? value : undefined);

export const extractItems = (response: IDataObject): IDataObject[] => {
	const items = response.items;
	if (Array.isArray(items)) {
		return items.filter((item): item is IDataObject => typeof item === 'object' && item !== null) as IDataObject[];
	}

	if (Array.isArray(response.response)) {
		return response.response.filter((item): item is IDataObject => typeof item === 'object' && item !== null) as IDataObject[];
	}

	return [];
};

export const dedupeByIdentity = (items: IDataObject[]): IDataObject[] => {
	const seen = new Set<string>();
	const result: IDataObject[] = [];

	for (const item of items) {
		const id = item.id ?? item.user_id ?? item.group_id ?? item.member_id;
		const screenName = asString(item.screen_name) ?? asString(item.domain);
		const key = id !== undefined ? `id:${String(id)}` : screenName ? `sn:${screenName.toLowerCase()}` : undefined;
		if (!key) {
			result.push(item);
			continue;
		}
		if (seen.has(key)) continue;
		seen.add(key);
		result.push(item);
	}

	return result;
};

export const enrichUserItem = (item: IDataObject): IDataObject => {
	const city = asRecord(item.city);
	const screenName = asString(item.screen_name) ?? asString(item.domain);
	return {
		...item,
		screen_name: screenName,
		screen_name_url: screenName ? `https://vk.com/${screenName}` : undefined,
		city_title: asString(city.title),
	};
};

export const enrichGroupItem = (item: IDataObject): IDataObject => {
	const city = asRecord(item.city);
	const screenName = asString(item.screen_name);
	return {
		...item,
		screen_name_url: screenName ? `https://vk.com/${screenName}` : undefined,
		city_title: asString(city.title),
	};
};
