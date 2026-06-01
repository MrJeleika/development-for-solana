use anchor_lang::prelude::*;

/// One deposit, stored inline in the raffle's `entries` array.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct EntryData {
    pub depositor: Pubkey,
    pub weight: u64,
}
