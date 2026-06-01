use anchor_lang::prelude::*;

/// VRF result account. `oracle` is the only identity allowed to deliver `value`;
/// record it when you create this account, then the callback can be trusted.
#[account]
#[derive(InitSpace)]
pub struct Randomness {
    pub oracle: Pubkey,
    pub value: [u8; 32],
    pub fulfilled: bool,
}
