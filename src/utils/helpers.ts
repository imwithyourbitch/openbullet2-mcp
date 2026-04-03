import { z } from 'zod';

export const zOptionalString = z.string().optional();
export const zOptionalNumber = z.number().optional();
export const zOptionalBoolean = z.boolean().optional();

export function makeToolDef<Schema extends z.ZodRawShape>(
  description: string,
  schema: Schema,
  handler: (args: z.ZodObject<Schema>['_output']) => Promise<{ content: Array<{ type: string; text: string }> }>,
) {
  return {
    description,
    inputSchema: schema,
    handler,
  };
}
