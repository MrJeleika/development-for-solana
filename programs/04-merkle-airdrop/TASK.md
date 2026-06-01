# 04 — Merkle Airdrop

An airdrop with **two independent ways to claim**: prove you're on a list (a
Merkle proof), or present a signature from a trusted signer. Either way you can
claim your allocation exactly once. (This is the Solana counterpart of the
Solidity `05-merkle-airdrop`, and stands on its own.)

This module ships as a **starter** — the design is yours to figure out.

## What you're given

- `src/lib.rs` — the program's three instructions.
- `src/constants.rs` — the seeds.
- `tests/04-merkle-airdrop/fixture.ts` + `merkle-airdrop.test.ts` — one
  happy-path test: a successful Merkle claim. It leans on the stubs you fill in.
- `tests/04-merkle-airdrop/merkle.ts` + `signatures.ts` — off-chain helper stubs.

## What you implement

- The program: account layouts, errors, and the logic for both claim paths.
- `merkle.ts` (build the tree, root, and proofs) and `signatures.ts` (produce
  the signature) — your off-chain conventions must match what the program checks.
- The claim-marker PDA derivation left as `TODO` in the test.
- The rest of the tests (the signature path, already-claimed, bad proof, a
  signature meant for someone else, etc.).

## Flow

1. **Initialize** — record the airdrop token, the Merkle root, and the trusted
   signer; the vault is funded with the tokens.
2. **Claim (proof)** — prove `(you, amount)` is on the list; receive your tokens.
3. **Claim (signature)** — present a signature from the trusted signer
   authorizing you to claim `amount`; receive your tokens. No list needed.
4. Claiming by **either** path marks you claimed — you can't claim again by either.

## Constraint

Implement the proof verification and the signature check **yourself**. Don't
reach for a library that does Merkle verification or signature checking for you.
A signature must be usable only by its intended recipient, and only against this
deployment.
