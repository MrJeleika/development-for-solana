use anchor_lang::prelude::*;

/// Singleton account that receives donations and tracks the unique donor count.
#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub unique_donor_count: u64,
}
