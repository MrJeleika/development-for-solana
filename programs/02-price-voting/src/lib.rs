use anchor_lang::prelude::*;

declare_id!("BG1zKVBhFmEi3CTGFf2NhEd9QwTH6N7g6Qtv9Ldidncf");

// STUB — see TASK.md. Token holders lock tokens behind a price to vote; after
// the deadline anyone finalizes the winning (most-weighted) price, then voters
// claim their locked tokens back. Implement the instructions and accounts here,
// then write the bankrun suite in `tests/02-price-voting.test.ts`.
#[program]
pub mod price_voting {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
