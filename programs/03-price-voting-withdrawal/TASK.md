# 03 — Voting on Token Price with Withdrawal

> **Status: stub.** Implement
> `programs/03-price-voting-withdrawal/src/lib.rs` and write
> `tests/03-price-voting-withdrawal.test.ts`.

Like `02-price-voting`, but voters may **withdraw** their locked tokens at any
time, including during the voting window. The hard part is keeping per-price
weight consistent as votes are removed, and resolving the winning price after
withdrawals.

## Things to decide

- How withdrawing decrements the relevant price's weight.
- How the leader is resolved when the previous leader's weight drops (a single
  cached leader is no longer enough — think about how you re-derive the winner).
- Signatures, events/logs, and errors are entirely your design.

Reflection: why does allowing withdrawals make a cached "current leader"
insufficient, and what does that cost you?
