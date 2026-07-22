# Architecture reference

<!-- TODO: Customize this file per project. This is a starter template. -->

Loaded by `feature-implementation` when the change touches core domain logic.

## Layering
Most healthy codebases have (at minimum) three layers. Name them however your project names them:

- **Presentation** — routes, handlers, views. No business logic. Translates between transport (HTTP/CLI/events) and the domain.
- **Domain** — pure business logic. No I/O. Pure functions where possible. This is where the interesting rules live.
- **Infrastructure** — DB, HTTP clients, file system, external services. Implements interfaces defined by the domain.

**The golden rule:** dependencies point inward. Domain does not know about HTTP. Domain does not know about the DB schema.

## What to check before adding code
1. Does this belong in an existing module, or is it genuinely new?
2. Am I introducing a dependency from a lower layer to a higher layer? (If yes, stop and rethink.)
3. Is there already an abstraction for this I should reuse?
4. Will this change force a migration (DB, API contract, config)? If yes, plan that explicitly.

## Common mistakes
- Putting validation in the route handler instead of the domain.
- Hard-coding external service URLs instead of injecting a client.
- Business logic in SQL (it belongs in the domain, not the DB).
- "Utility" folders that become dumping grounds — prefer cohesive modules.

## How to add a new domain concept
1. Define the type/interface in the domain layer.
2. Add the pure logic as functions on that type (or a dedicated service).
3. Add an infrastructure implementation if I/O is required.
4. Wire it up at the presentation layer.
5. Tests at each layer, unit for domain, integration for infra.
