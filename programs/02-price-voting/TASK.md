# 02 — Voting on Token Price

> **Status: stub.** Implement `programs/02-price-voting/src/lib.rs` and write
> `tests/02-price-voting.test.ts`. See `programs/01-token` for the patterns.

Token holders lock tokens behind a price to vote on it. While voting is open,
anyone can vote for a `price` with an `amount`; the program pulls those tokens
into a PDA-owned vault. After the deadline, anyone can finalize once to set the
winning (most-weighted) price, and voters then claim their locked tokens back.

## Suggested shape

- A `Poll` account: the voted token mint, `voting_end` (unix ts), the current
  leader `(price, weight)`, the finalized price, and a `finalized` flag.
- Per-price weight: a PDA keyed by `(poll, price)` accumulating locked amount.
- Per-voter lock: a PDA keyed by `(poll, voter)` recording the locked amount.
- A vault: a PDA token account holding all locked tokens.

## Instructions

- `initialize(voting_end)` — store the mint and deadline.
- `vote(price, amount)` — only before `voting_end`; transfer tokens in, bump the
  price weight and the voter's lock, update the leader.
- `finalize()` — only after `voting_end`, once; record the winning price.
- `claim()` — return the voter's locked tokens.

Mirror the EVM contract's behavior; design the Anchor accounts/errors yourself.
