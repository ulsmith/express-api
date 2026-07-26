import { z } from 'zod';

export type ZodMethodSchema = {
	description: string;
	security?: Record<string, any[]>[];
	params?: z.ZodType<any>;
	query?: z.ZodType<any>;
	body?: z.ZodType<any>;
	response?: Record<number, {
		description: string;
		schema: z.ZodType<any>;
	}>;
};

export type ZodSchema = {
	[method: string]: ZodMethodSchema;
};

export type ZodServiceSchema = {
	post: ZodMethodSchema;
};
