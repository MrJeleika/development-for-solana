# 01 — Academy Token

The Solana/Anchor counterpart of the ERC-20 token task. This module ships
**fully implemented** as the reference example for the template: read it to see
how an Anchor program, PDAs, CPIs into SPL Token, and a bankrun test suite fit
together. Later modules (`02`–`06`) are stubs for you to implement.

## Background

On Ethereum a token is its own contract that keeps a balance ledger in storage.
On Solana that ledger already exists: the **SPL Token** program. A "token" is a
`Mint` account, and balances live in per-owner `TokenAccount`s (usually the
**Associated Token Account**, a PDA derived from `(owner, mint)`).

So this program does not re-implement balances or allowances. Instead it:

- owns a `Mint` whose **mint authority is a PDA** (`config`), so only this
  program can mint;
- stores a small `Config` account recording the `owner` and `mint`;
- exposes the privileged operations via CPI into SPL Token.

## What it does

- `initialize(decimals, initial_supply)` — creates the `config` PDA and the
  `mint` PDA (authority = `config`), then mints `initial_supply` to the
  creator's ATA. Mirrors the ERC-20 constructor.
- `mint_tokens(amount)` — owner-only (`has_one = owner`); mints to any
  recipient's ATA.
- `burn_tokens(amount)` — burns from the caller's own ATA.

## Accounts / PDAs

| PDA      | Seeds        | Purpose                          |
| -------- | ------------ | -------------------------------- |
| `config` | `[b"config"]`| owner + mint record, mint authority |
| `mint`   | `[b"mint"]`  | the SPL mint                     |

## Run it

```bash
npm run test:token
```

## Notes

- Equivalents to ERC-20 `transfer` / `approve` / `transferFrom` are **not** in
  this program — on Solana those are instructions on the SPL Token program
  itself, called directly by clients, not re-implemented here.
- `init_if_needed` is enabled so ATAs are created on first use.
