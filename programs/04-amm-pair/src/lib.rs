use anchor_lang::prelude::*;

declare_id!("A1g16Bjuq9zNiekkSp3JF9X6q9JdJDzhqwz1HQ8tF3kP");

// STUB — see TASK.md. A constant-product (x*y=k) AMM pair over two SPL mints:
// add/remove liquidity (minting/burning LP tokens) and swap with a fee. Hold
// reserves in PDA-owned vaults. Implement the instructions and accounts here,
// then write the bankrun suite in `tests/04-amm-pair.test.ts`.
#[program]
pub mod amm_pair {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
