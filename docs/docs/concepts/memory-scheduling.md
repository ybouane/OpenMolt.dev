---
sidebar_position: 4
title: Memory & Scheduling
---

# Memory & Scheduling

## Memory

Agents have two independent memory stores that persist across loop iterations.

| Store | Purpose |
|---|---|
| `longTerm` | Durable facts, learned preferences, previous task summaries |
| `shortTerm` | Temporary working notes for the current task |

### Configuration

```typescript
const agent = om.createAgent({
  memory: {
    longTerm: {
      data: '## Known facts\n- User timezone is America/New_York',
      onUpdate: async (newData) => {
        // Persist to your database whenever the agent updates memory
        await db.saveMemory('agent-1', newData);
      },
    },
    shortTerm: {
      data: '',
    },
  },
});
```

`data` is the initial content (plain text or JSON). `onUpdate` is called each time the agent issues an `updateMemory` command.

### How the agent uses memory

The agent can update memory at any time using the `updateMemory` command:

```json
{
  "type": "updateMemory",
  "memoryType": "longTerm",
  "mode": "append",
  "data": "- Completed onboarding for user #4231 on 2025-03-06"
}
```

`mode: "replace"` overwrites the entire store; `mode: "append"` concatenates.

---

## Scheduling

Run an agent repeatedly without writing your own `setInterval` loop.

### Interval schedule

```typescript
// Every 20 minutes
const scheduleId = agent.schedule({ type: 'interval', value: 20 * 60 });
```

### Daily schedule

```typescript
// Every weekday at 09:00 America/New_York
const scheduleId = agent.schedule({
  type: 'daily',
  dayOfWeek: [1, 2, 3, 4, 5],   // Mon–Fri
  hour: 9,
  minute: 0,
  timeZone: 'America/New_York',
});
```

`dayOfWeek` and `dayOfMonth` are both optional filters. Omit them to run every day.

### Cancelling a schedule

```typescript
agent.cancelSchedule(scheduleId);
```

### Example: keep a process running

```typescript
const id = agent.schedule({ type: 'interval', value: 300 });

process.on('SIGINT', () => {
  agent.cancelSchedule(id);
  process.exit(0);
});
```

Each scheduled run calls `agent.run(undefined)` — the agent uses its instructions and memory to decide what to do without explicit input.
