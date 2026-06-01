use anchor_lang::prelude::*;

use crate::error::RaffleError;
use crate::state::Randomness;

// The VRF callback. The VRF program invokes this signed by its identity, with the
// accounts named in the request — so `oracle` (the signer) comes first, then the
// `Randomness` account. Only the oracle recorded at init may deliver a value;
// anyone else calling here is rejected.
#[derive(Accounts)]
pub struct ConsumeRandomness<'info> {
    pub oracle: Signer<'info>,

    #[account(mut, seeds = [b"randomness"], bump)]
    pub randomness: Account<'info, Randomness>,
}

pub fn consume_randomness(ctx: Context<ConsumeRandomness>, randomness: [u8; 32]) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.oracle.key(),
        ctx.accounts.randomness.oracle,
        RaffleError::UntrustedOracle
    );
    let r = &mut ctx.accounts.randomness;
    r.value = randomness;
    r.fulfilled = true;
    Ok(())
}
