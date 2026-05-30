# 05 — Merkle Airdrop

> **Status: stub.** Implement `programs/05-merkle-airdrop/src/lib.rs` and write
> `tests/05-merkle-airdrop.test.ts`.

Distribute SPL tokens to a fixed list of `(claimant, amount)` allocations
committed on-chain as a single **Merkle root**. Each claimant submits a proof
and receives their allocation exactly once.

## Suggested shape

- An `Airdrop` account: the token mint, the 32-byte Merkle `root`, the vault,
  bump.
- A PDA-owned **vault** holding the distributable tokens.
- A per-claim marker PDA (seeds include the leaf index or claimant) created on
  claim so a second claim fails — the Solana equivalent of a `claimed` bitmap.

## Instructions

- `initialize(root)` — store the root; fund the vault.
- `claim(index, amount, proof)` — recompute the leaf
  (`hash(index, claimant, amount)`), verify `proof` against `root`, create the
  marker, transfer `amount` from the vault.

Build the tree off-chain in the test (`merkletreejs`) and pass proofs in. Match
the leaf hashing exactly on both sides.
