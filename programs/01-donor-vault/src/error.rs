use anchor_lang::prelude::*;

#[error_code]
pub enum DonorVaultError {
    #[msg("donation amount must be greater than zero")]
    ZeroDonation,
    #[msg("message exceeds the maximum allowed length")]
    MessageTooLong,
    #[msg("donation index out of bounds")]
    IndexOutOfBounds,
    #[msg("arithmetic overflow")]
    Overflow,
}
