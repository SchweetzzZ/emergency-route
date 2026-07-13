# EmergenceRoute

NestJS API for emergency dispatch and real-time vehicle tracking. The system uses PostgreSQL, Kafka, RabbitMQ, Redis, Prisma, and Socket.IO.

## Modules

- **Dispatch:** creates incidents, assigns the nearest available vehicle, and tracks the assignment lifecycle: `ASSIGNED → ACCEPTED → EN_ROUTE → ARRIVED → COMPLETED`.
- **Tracking:** receives live GPS telemetry through WebSocket, records history, and updates operators in real time.
- **Realtime:** authenticates Socket.IO clients and publishes dispatch and location events to subscribed vehicle rooms.

## Tracking architecture

Telemetry is WebSocket-first. HTTP remains available for authenticated read operations, history, statistics, and issuing device tokens; it is not used to publish live GPS positions.

```text
Tracker
  → WebSocket: location.update
  → validates device token and payload
  → Kafka: location-updates
  → consumer writes Telemetry and updates Vehicule
  → WebSocket: vehicule.location.updated
  → Operator dashboard
```

The tracker stores unconfirmed positions in a local queue. Each event has a stable `eventId`; after reconnection, the same event can be resent safely without duplicating telemetry.

### Socket.IO events

| Event | Direction | Purpose |
| --- | --- | --- |
| `location.update` | tracker → API | Sends a validated GPS position. |
| `location.accepted` | API → tracker | Confirms Kafka accepted the event. |
| `vehicule.location.updated` | API → dashboard | Sends a processed live position to subscribed operators. |
| `vehicule_join` / `vehicule_leave` | dashboard → API | Joins or leaves a vehicle room. |
| `dispatch_assigned` | API → dashboard | Notifies a dispatched vehicle. |
| `location.simulate` | admin dashboard → API | Development-only route simulation. |

### Location payload

```json
{
  "eventId": "uuid",
  "sequence": 42,
  "vehiculeId": "uuid",
  "latitude": -23.561684,
  "longitude": -46.655981,
  "speed": 11.1,
  "accuracy": 5,
  "heading": 90,
  "capturedAt": "2026-07-13T12:00:00.000Z"
}
```

`eventId` is unique and makes Kafka retries idempotent. `capturedAt` records when GPS captured the position, rather than when the server received it.

## Kafka delivery guarantee

Location events are sent with `acks: -1`:

```ts
await producer.send({
  topic: "location-updates",
  acks: -1,
  messages: [{ key: vehiculeId, value: JSON.stringify(location) }],
});
```

The API emits `location.accepted` only after `producer.send()` resolves. If Kafka rejects the message, the tracker keeps it in its local queue. This confirms Kafka accepted the event; PostgreSQL persistence happens asynchronously in the consumer.

The compose environment uses one Kafka broker, so `acks: -1` confirms the single broker only. Production replication requires multiple brokers and an appropriate `min.insync.replicas` configuration.

## Authentication

An admin issues a temporary device token for a vehicle:

```text
POST /tracking/device-token/:vehiculeId
Authorization: Bearer <admin-user-token>
```

The device token expires after 12 hours and can only publish positions for its associated vehicle.

## Tracking read endpoints

- `GET /tracking/current/:vehiculeId`
- `GET /tracking/history/:vehiculeId`
- `GET /tracking/telemetry/:vehiculeId?hours=2`
- `GET /tracking/stats/:vehiculeId`

## Setup

```bash
cd backend
npm install
npm exec prisma generate
npm exec prisma migrate deploy
npm run start:dev
```

For the full local stack:

```bash
docker compose up --build
```

## Verification

```bash
npm exec prisma validate
npm run build
```
