use anchor_lang::prelude::*;

declare_id!("Ha5343T7Ld9Toc6vT9msr7Bu5D9DRFRP5JN8Hy7qm7sn");

// STUB — see TASK.md. A raffle: players buy tickets during an open window;
// after it closes a winner is drawn and takes the pot. On Ethereum the original
// uses Chainlink VRF for randomness — on Solana, pick and document a source
// (e.g. a verifiable randomness oracle, or a committed slot hash for the
// learning version). Implement the instructions and accounts here, then write
// the bankrun suite in `tests/06-raffle.test.ts`.
#[program]
pub mod raffle {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
