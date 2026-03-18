export type IDataObject = Record<string, unknown>;

export interface INodeProperties {
	displayName: string;
	name: string;
	type: string;
	default: unknown;
	required?: boolean;
	description?: string;
	typeOptions?: IDataObject;
	displayOptions?: { show: Record<string, string[]> };
	options?: Array<{ name: string; value: string | number }>;
}

export interface ICredentialType {
	name: string;
	displayName: string;
	documentationUrl?: string;
	properties: INodeProperties[];
}

export interface INodeTypeDescription {
	displayName: string;
	name: string;
	icon: string;
	group: string[];
	version: number;
	subtitle?: string;
	description: string;
	defaults: { name: string };
	inputs: string[];
	outputs: string[];
	credentials: Array<{ name: string; required: boolean }>;
	properties: INodeProperties[];
}

export interface INodeExecutionData {
	json: IDataObject;
	pairedItem?: { item: number };
}

export interface IExecuteFunctions {
	getInputData(): INodeExecutionData[];
	getCredentials(name: string): Promise<unknown>;
	getNodeParameter(name: string, itemIndex: number): unknown;
	getNode(): { name: string };
	continueOnFail(): boolean;
}

export interface INodeType {
	description: INodeTypeDescription;
	execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}

export class NodeOperationError extends Error {
	constructor(node: { name: string }, message: string) {
		super(`[${node.name}] ${message}`);
	}
}
