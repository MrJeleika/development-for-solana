# Solana Template — Anchor + Rust

The Solana counterpart of the Solidity course template, rebuilt with
[Anchor](https://www.anchor-lang.com/) and Rust. Same numbered tasks, same
"read the brief, implement, test" workflow — but as on-chain **programs** tested
with [bankrun](https://kevinheavey.github.io/solana-bankrun/) instead of a local
validator.

## Requirements

- [Rust](https://rustup.rs/) + the Solana platform tools
- [Solana CLI](https://docs.anza.xyz/cli/install) **2.x**
- [Anchor](https://www.anchor-lang.com/docs/installation) **0.31.1**
- Node.js **18+** (see `.nvmrc`) and npm

Check your toolchain:

```bash
anchor --version   # anchor-cli 0.31.1
solana --version   # 2.x
node --version     # v18+
```

## Layout

```
.
├── Anchor.toml              # workspace config + program IDs
├── Cargo.toml               # Rust workspace
├── package.json
├── tsconfig.json
├── programs/                # one Anchor program per task
│   ├── 01-donor-vault/      # ← implemented reference example
│   │   ├── src/lib.rs
│   │   └── TASK.md          # brief — read this first
│   ├── 02-price-voting/     # stub
│   └── ...
├── tests/                   # one bankrun suite per task
│   └── 01-donor-vault.test.ts
└── migrations/deploy.ts
```

Unlike the Solidity template (one task compiled at a time), this is a single
Anchor workspace — `anchor build` compiles **all** programs at once and emits
IDLs + TypeScript types under `target/`.

## Tasks

| #   | Task                                                | Program crate             | Status      |
| --- | --------------------------------------------------- | ------------------------- | ----------- |
| 01  | [`01-donor-vault`](programs/01-donor-vault/)        | `donor_vault`             | implemented |
| 02  | [`02-price-voting`](programs/02-price-voting/)      | `price_voting`            | stub        |
| 03  | [`03-price-voting-withdrawal`](programs/03-price-voting-withdrawal/) | `price_voting_withdrawal` | stub |
| 04  | [`04-amm-pair`](programs/04-amm-pair/)              | `amm_pair`                | stub        |
| 05  | [`05-merkle-airdrop`](programs/05-merkle-airdrop/)  | `merkle_airdrop`          | stub        |
| 06  | [`06-raffle`](programs/06-raffle/)                  | `raffle`                  | stub        |

Each task has a `TASK.md` next to its source. `01-donor-vault` is fully
implemented as the reference; `02`–`06` ship as buildable stubs for you to flesh
out.

## Getting started

```bash
npm install
anchor build          # compiles every program, generates target/idl + types
npm run test:donorVault  # build + run the 01-donor-vault bankrun suite
```

Run everything:

```bash
npm test              # build + run all tests/*.test.ts
```

Per-task test scripts: `test:donorVault`, `test:priceVoting`,
`test:priceVotingWithdrawal`, `test:ammPair`, `test:merkleAirdrop`,
`test:raffle`.

## Testing with bankrun

Tests use `solana-bankrun` + `anchor-bankrun`: a fast in-process Solana bank, no
validator and no airdrops. The pattern (see `tests/01-donor-vault.test.ts`):

```ts
const context = await startAnchor("", [], []); // loads programs from Anchor.toml
const provider = new BankrunProvider(context);
const program = new Program<DonorVault>(idl, provider);
```

`startAnchor` reads `Anchor.toml` and loads each program's compiled `.so` from
`target/deploy`, so **build before testing** (the npm scripts do this for you)
The SPL Token and Associated Token programs are available in the bank out of the
box.

## Program IDs

Declared in `Anchor.toml` and each program's `declare_id!`, with keypairs in
`target/deploy/*-keypair.json`. After regenerating keys, run `anchor keys sync`
to keep `Anchor.toml` and the `declare_id!` macros aligned.

## Repo-wide helpers

```bash
npm run lint          # cargo fmt --check + clippy
npm run lint:fix      # cargo fmt
npm run prettier      # format TS/JSON/MD
```

## Workflow per task

1. Read the task's `TASK.md`.
2. Implement the program in `programs/<task>/src/lib.rs`.
3. Write the suite in `tests/<task>.test.ts` (01 ships with one as reference).
4. Run `npm run test:<task>` until green.
