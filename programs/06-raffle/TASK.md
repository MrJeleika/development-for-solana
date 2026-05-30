# 06 — Raffle

> **Status: stub.** Implement `programs/06-raffle/src/lib.rs` and write
> `tests/06-raffle.test.ts`.

Players buy tickets during an open window; after it closes a winner is drawn and
takes the pot. On Ethereum the original task uses Chainlink VRF for randomness
and a price feed — on Solana you choose and **document** the equivalents.

## Suggested shape

- A `Raffle` account: ticket price, `end_ts`, entrants/ticket count, the pot
  vault, the winner, and a drawn flag.
- A PDA-owned **vault** holding ticket payments (SOL or an SPL token).
- Per-entrant ticket records (PDA) so you can map a winning index to an address.

## Instructions

- `initialize(ticket_price, end_ts)`.
- `buy_ticket()` — only before `end_ts`; take payment, record the entrant.
- `draw()` — only after `end_ts`, once; pick a winner.
- `claim_prize()` — pay the pot to the winner.

## Randomness

Chainlink VRF has no drop-in on Solana. Options: a verifiable randomness oracle
(e.g. Switchboard), or — for the learning version — a committed recent
**slot hash** (`SlotHashes` sysvar). Note the trust assumptions of whatever you
pick; a naive `Clock`-based draw is predictable and should be called out.
