# 01 — Donor Tiers Vault

The Solana/Anchor counterpart of the Ethereum `DonorVault` task. This module
ships **fully implemented** as the reference example for the template: read it
to see how an Anchor program, PDAs, dynamically-grown accounts, and a bankrun
test suite fit together. Later modules (`02`–`06`) are stubs for you to
implement.

## The scenario

The contract layer for a charity platform. Anyone can send funds along with a
short message; the program classifies each donor by their cumulative
contribution and exposes the views the frontend needs to render a donor's full
history.

## Ethereum → Solana

The original task is written for Solidity. The faithful Solana translation:

| Solidity                          | This program                                                          |
| --------------------------------- | -------------------------------------------------------------------- |
| `msg.value` (ETH in wei)          | an explicit lamport `amount` transferred into the vault PDA           |
| `1 ether`                         | `1 SOL` = 1,000,000,000 lamports                                      |
| `mapping(address => Donation[])`  | a `DonorRecord` PDA per address + one `Donation` PDA per donation     |
| dynamic storage array             | one fixed-size account per donation, PDA-seeded by `(donor, index)`   |
| `revert ZeroDonation()`           | `require!(amount > 0, DonorVaultError::ZeroDonation)`                 |
| `view` functions                  | instructions returning a value, called with `.view()` off-chain       |

On Solana you don't grow one account to hold an unbounded list — you give each
item its own account. So a donation is its own PDA, seeded by the donor and a
zero-based index (`DonorRecord.donation_count`). Account sizes come from
`#[derive(InitSpace)]` (+ `#[max_len]` on the message), never hand-counted.

## What it does

- `initialize()` — creates the singleton `vault` PDA that receives donations and
  holds the unique donor count. (Solidity's constructor.)
- `donate(amount, message)` — transfers `amount` lamports into the vault,
  creates a new `Donation { amount, timestamp, message }` account at the donor's
  next index, and adds to their cumulative total. Reverts `ZeroDonation` if
  `amount == 0`. The first donation from an address bumps the unique donor
  count; later donations from the same address do not.
- `tier_of(donor)` — the donor's `Tier`, derived from their cumulative total.
  This is the **only** getter: the tier is computed, not stored.

Everything else the frontend reads by fetching accounts directly — there is no
point adding on-chain getters that just hand back stored bytes:

| You want…                | Fetch…                                            |
| ------------------------ | ------------------------------------------------- |
| total donated by an addr | `DonorRecord.total`                               |
| number of donations      | `DonorRecord.donation_count`                      |
| a single donation        | the `Donation` PDA at `[b"donation", donor, i]`   |
| unique donor count       | `Vault.unique_donor_count`                        |

## Tiers

`Tier` is `{ None, Bronze, Silver, Gold, Platinum }` (this order is fixed — it
is the on-chain/IDL encoding). Boundaries are strict, on the cumulative total:

| Tier     | Cumulative total            |
| -------- | --------------------------- |
| None     | `total == 0`                |
| Bronze   | `0 < total < 0.1 SOL`       |
| Silver   | `0.1 SOL ≤ total < 1 SOL`   |
| Gold     | `1 SOL ≤ total < 10 SOL`    |
| Platinum | `10 SOL ≤ total`            |

Boundary checks: `0` → None, `1` lamport → Bronze, exactly `0.1 SOL` → Silver,
exactly `10 SOL` → Platinum.

## Accounts / PDAs

| PDA            | Seeds                              | Purpose                              |
| -------------- | --------------------------------- | ------------------------------------ |
| `vault`        | `[b"vault"]`                      | unique donor count; receives lamports |
| `donor_record` | `[b"donor", donor_key]`          | one donor's total + donation count   |
| `donation`     | `[b"donation", donor_key, index]` | a single donation (index is `u64` LE) |

## Run it

```bash
npm run test:donorVault
```

## Notes

- A non-existent `donor_record` means the address has never donated — the
  client treats that absence as `None` / count `0`, the same default a Solidity
  mapping would return. `tier_of` requires the record to exist, so call it only
  for addresses that have donated.
- Each donation is its own fixed-size account, paid for and rent-funded by the
  donor; there is no `realloc`. Index `i` is always at
  `[b"donation", donor, i]`, so the frontend can fetch any donation directly.
- `init_if_needed` is enabled so a donor's record is created on first donation;
  each `donation` account uses plain `init` (a fresh account every time).
