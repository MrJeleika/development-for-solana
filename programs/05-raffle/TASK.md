# 05 — Raffle (VRF)

Players deposit a token to enter; the more you deposit, the better your odds.
After a deadline, a **verifiably random** draw picks one weighted winner, who
takes the whole pot. The randomness comes from **MagicBlock VRF**: you request
it, and the oracle calls your program back with the result. (This is the Solana
counterpart of the Solidity `06-raffle`.)

This is a late milestone, so it ships as a **starter with almost nothing
designed for you** — the accounts, the storage, and the winner logic are yours.

## What you're given

The VRF wiring only — it's plumbing, not the puzzle:

- `request_randomness` — the CPI that asks MagicBlock VRF for a value (the
  `#[vrf]` macro, `create_request_randomness_ix`, `invoke_signed_vrf`).
- `consume_randomness` — the oracle's callback, including the check that the
  caller really is the trusted oracle.
- `state::Randomness` — a small account holding the trusted `oracle` and the
  delivered `value`. The callback writes into it.
- `Cargo.toml` with the VRF SDK already wired (the `anchor-compat` feature).
- `tests/05-raffle/fixture.ts` — bankrun setup, a funded mint, and
  `fulfillRandomness(env, value)`, which mocks the oracle's callback so your
  tests can drive a draw without a live oracle.

## What you implement

Everything else — and that's the point:

- All state (besides `Randomness`), the errors, the seeds.
- `initialize` — set up the raffle and **create the `Randomness` account,
  storing the trusted oracle** (`env.oracle` in the tests).
- `deposit` — take the tokens into a vault and record the entry.
- The guard in `request_randomness` (deadline passed, entries exist, only once).
- `claim` — pay the winner.
- The tests (the happy path is stubbed; add the failure modes).

## Flow

1. **Initialize** — open the raffle; record the deadline and the trusted oracle.
2. **Deposit** — enter while the raffle is open; your weight is your deposit.
3. **Request randomness** — after the deadline, trigger the draw. Once.
4. **Consume randomness** — the oracle's callback delivers the value.
5. **Claim** — the winner proves they won and takes the pot. Once.

## The puzzle

A deposit's chance of winning must be proportional to its size, and nobody — not
a player, not a validator, not whoever triggers the draw — can bias or predict
the result. Work out a data structure where the winner can **prove** they won
from a single random value, without the program looping over every entry.
