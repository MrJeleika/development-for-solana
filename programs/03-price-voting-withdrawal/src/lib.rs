use anchor_lang::prelude::*;

declare_id!("5oVN5zywZG6XTUSrgD3qLkpUynYzPNh1MJyqGYK6drm9");

// STUB — see TASK.md. Like 02-price-voting, but voters may withdraw their
// locked tokens at any time, including during the voting window — which means
// per-price weight has to stay consistent as votes are removed. Implement the
// instructions and accounts here, then write the bankrun suite in
// `tests/03-price-voting-withdrawal.test.ts`.
#[program]
pub mod price_voting_withdrawal {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
