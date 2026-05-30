use anchor_lang::prelude::*;

declare_id!("B2RUWYg2zsmtu63qNxznF9DZkQ8Gbfymq22jXSpc4Lpf");

// STUB — see TASK.md. Distribute SPL tokens to a set of (claimant, amount)
// leaves committed as a Merkle root. A claimant submits a proof and receives
// their allocation exactly once (track claimed status per leaf). Implement the
// instructions and accounts here, then write the bankrun suite in
// `tests/05-merkle-airdrop.test.ts`.
#[program]
pub mod merkle_airdrop {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
