export type InputKind = 'barcode' | 'name';

export type ClassifiedInput = {
	kind: InputKind;
	value: string;
};

const EAN_OR_UPC = /^\d{8,14}$/;
const GROCYCODE = /^grcy:/i;

export function classifyInput(raw: string): ClassifiedInput {
	const value = raw.trim();
	const compact = value.replace(/\s+/g, '');

	if (GROCYCODE.test(value)) {
		return { kind: 'barcode', value };
	}

	if (EAN_OR_UPC.test(compact)) {
		return { kind: 'barcode', value: compact };
	}

	return { kind: 'name', value };
}
