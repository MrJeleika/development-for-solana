use anchor_lang::prelude::*;

/// Singleton raffle state. `total_weight` is the sum of all deposits and the
/// exclusive upper bound of the ticket space.
#[account]
#[derive(InitSpace)]
pub struct Raffle {
    pub mint: Pubkey,
    pub draw_time: i64,
    pub total_weight: u64,
    pub entry_count: u64,
    pub claimed: bool,
}
