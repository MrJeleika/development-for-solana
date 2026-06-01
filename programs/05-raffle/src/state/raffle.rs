use anchor_lang::prelude::*;

use crate::state::EntryData;

/// Max entrants the raffle can hold (the array is sized once at init).
pub const MAX_ENTRIES: usize = 50;

/// Singleton raffle state. Entrants are stored inline in `entries`.
#[account]
#[derive(InitSpace)]
pub struct Raffle {
    pub mint: Pubkey,
    pub draw_time: i64,
    pub total_weight: u64,
    pub claimed: bool,
    #[max_len(MAX_ENTRIES)]
    pub entries: Vec<EntryData>,
}
