import { z } from "zod"

export const TrackingSchema = z.object({
    vehiculeId: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    // Campos nativos da Browser Geolocation API (position.coords.*)
    speed: z.number().nullable().optional(),    // m/s — pode ser null em dispositivos sem GPS
    accuracy: z.number().optional(),            // precisão em metros
    heading: z.number().nullable().optional(),  // direção em graus (0-360), null se parado
})
export type TrackingInputDTO = z.infer<typeof TrackingSchema>