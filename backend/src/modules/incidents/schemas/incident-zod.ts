import { z } from 'zod';

export const createIncidentSchema = z.object({
    type: z.enum(['ACCIDENT', 'FIRE', 'MEDICAL']),
    location: z.string(),
    description: z.string(),
    plate: z.string(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED']),
    latitude: z.number(),
    longitude: z.number(),
    avaliable: z.boolean(),
});
export const updateIncidentSchema = createIncidentSchema.partial();

export type CreateIncidentDto = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentDto = z.infer<typeof updateIncidentSchema>;