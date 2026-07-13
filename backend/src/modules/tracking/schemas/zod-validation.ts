import { z } from "zod";

export const TrackingSchema = z.object({
    vehiculeId: z.string().uuid(),
    eventId: z.string().uuid(),
    sequence: z.number().int().nonnegative(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    speed: z.number().nonnegative().nullable().optional(),
    accuracy: z.number().nonnegative().nullable().optional(),
    heading: z.number().min(0).max(360).nullable().optional(),
    capturedAt: z.string().datetime(),
});

export type TrackingInputDTO = z.infer<typeof TrackingSchema>;
