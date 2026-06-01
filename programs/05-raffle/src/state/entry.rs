use anchor_lang::prelude::*;

/// One deposit, owning the half-open ticket range `[range_start, range_end)`.
/// The winner is the entry whose range contains the drawn ticket.
#[account]
#[derive(InitSpace)]
pub struct Entry {
    pub depositor: Pubkey,
    pub range_start: u64,
    pub range_end: u64,
}
