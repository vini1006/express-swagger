import 'reflect-metadata';
import type { AnyConstructor } from '@oapif/type';

const SCHEMA_META = 'custom:data-schema-label' as const;

export const defineSchemaLabelMetaData = (
	target: AnyConstructor,
	label: string,
) => {
	Reflect.defineMetadata(SCHEMA_META, label, target);
};

export const getSchemaLabelMetaData = (target: AnyConstructor) => {
	return Reflect.getMetadata(SCHEMA_META, target);
};
