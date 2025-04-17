import { castArray, flattenDeep, pipe } from 'lodash/fp';
import { z } from 'zod';
import type { ZodTypeAny } from 'zod/lib/types';

import Controller from '@/oapif/controller/Controller';

import { ViewRenderer } from '@/oapif/model/ViewRenderer';

import { defineControllerResponseMetaData } from '@/oapif/reflect-metadata/controller';

export const Response = (
	statusCode: number,
	returnType: ZodTypeAny | ZodTypeAny[] | typeof ViewRenderer,
): MethodDecorator => {
	if (!returnType || (Array.isArray(returnType) && returnType.length === 0)) {
		throw new Error('Response decorator requires a return type');
	}

	return (target, methodName, descriptor) => {
		if (!(target instanceof Controller)) {
			throw new Error(
				'Response decorator can only be used on classes that extend AbstractController',
			);
		}

		defineControllerResponseMetaData(target, methodName as string, {
			statusCode,
			returnType: castReturnType(returnType),
		});
	};
};

const castReturnType = (
	arg: ZodTypeAny | ZodTypeAny[] | typeof ViewRenderer,
) => {
	if (arg === ViewRenderer) {
		return ViewRenderer;
	}

	return pipe(castArray, flattenDeep, (arr: ZodTypeAny[]) => {
		if (arr.length === 0) {
			throw new Error('Response decorator requires a return type');
		}

		if (arr.length === 1) {
			return arr[0];
		}

		return z.union(
			arr as unknown as readonly [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]],
		);
	})(arg);
};
