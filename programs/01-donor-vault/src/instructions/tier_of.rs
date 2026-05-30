use anchor_lang::prelude::*;

use crate::constants::DONOR_SEED;
use crate::state::{DonorRecord, Tier};

#[derive(Accounts)]
pub struct TierOf<'info> {
    /// CHECK: only used to derive the donor record PDA.
    pub donor: UncheckedAccount<'info>,

    #[account(seeds = [DONOR_SEED, donor.key().as_ref()], bump)]
    pub donor_record: Account<'info, DonorRecord>,
}

/// View: the donor's current tier, derived from their cumulative total.
///
/// This is the one getter worth keeping on-chain: the tier is *computed* from
/// `total`, it isn't stored anywhere. Everything else (total, counts, the
/// donations themselves) the frontend reads by fetching the accounts directly.
/// Call it off-chain with `.view()` (a simulation that returns data).
pub fn tier_of(ctx: Context<TierOf>) -> Result<Tier> {
    Ok(Tier::from_total(ctx.accounts.donor_record.total))
}
