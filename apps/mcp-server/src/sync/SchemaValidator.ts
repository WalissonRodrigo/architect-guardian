import { z } from 'zod';
import { SkillManifest } from '@architect-guardian/shared-types';

export const SkillManifestSchema = z.object({
    name: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    description: z.string(),
    author: z.string().optional(),
    tags: z.array(z.string()),
    detectors: z.object({
        filePatterns: z.array(z.string()).optional(),
        languages: z.array(z.string()).optional(),
        frameworks: z.array(z.string()).optional(),
        contentPatterns: z.array(z.string()).optional(),
    }),
    capabilities: z.array(z.object({
        name: z.string(),
        description: z.string(),
        inputSchema: z.record(z.string(), z.any()),
        outputSchema: z.record(z.string(), z.any()).optional(),
    })),
    config: z.record(z.string(), z.any()).optional(),
});

export class SchemaValidator {
    validate(data: unknown): SkillManifest {
        const result = SkillManifestSchema.safeParse(data);
        if (!result.success) {
            const errors = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            throw new Error(`Invalid skill manifest: ${errors}`);
        }
        return result.data as SkillManifest;
    }
}
