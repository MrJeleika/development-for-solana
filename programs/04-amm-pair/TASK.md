# 04 — AMM Pair

> **Status: stub.** Implement `programs/04-amm-pair/src/lib.rs` and write
> `tests/04-amm-pair.test.ts`.

A constant-product (`x * y = k`) automated market maker over two SPL token
mints — the Solana analogue of a Uniswap V2 pair.

## Suggested shape

- A `Pair` account: the two mints, the LP mint, the two vault addresses, bump.
- Two PDA-owned **vaults** (token accounts) holding the reserves.
- An LP **mint** (authority = pair PDA) representing pool shares.

## Instructions

- `initialize(...)` — create vaults and the LP mint.
- `add_liquidity(amount_a, amount_b, min_lp)` — pull both tokens, mint LP. First
  deposit sets the price; later deposits must respect the current ratio.
- `remove_liquidity(lp_amount, min_a, min_b)` — burn LP, return both tokens
  pro-rata.
- `swap(amount_in, min_out, a_to_b)` — apply the fee (e.g. 0.3%), enforce the
  constant-product invariant, transfer out.

Watch for: integer math / rounding, the initial-liquidity sqrt, and slippage
checks.
