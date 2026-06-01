use anchor_lang::prelude::*;

#[error_code]
pub enum RaffleError {
    #[msg("the random value did not come from the trusted oracle")]
    UntrustedOracle,
    // TODO: add the rest of the errors this program needs.
}
