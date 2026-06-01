import { z } from "zod"

export const createVehiculeSchema = z.object({
    name: z.string(),
    plate: z.string(),
    type: z.enum([
        "AMBULANCE",
        "FIRE_TRUCK",
        "POLICE_CAR",
        "TOW_TRUCK"
    ]),
    status: z.enum([
        "AVAILABLE",
        "DISPATCHED",
        "BUSY",
        "OFFLINE",
        "EN_ROUTE",
        "AT_INCIDENT"
    ]),
    latitude: z.number(),
    longitude: z.number(),
})

export type CreateVehiculeDto = z.infer<typeof createVehiculeSchema>

export const updateVehiculeSchema = createVehiculeSchema.partial()

export type UpdateVehiculeDto = z.infer<typeof updateVehiculeSchema>