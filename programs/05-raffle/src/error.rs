use anchor_lang::prelude::*;

#[error_code]
pub enum RaffleError {
    #[msg("the random value did not come from the trusted oracle")]
    UntrustedOracle,
    #[msg("deposit must be greater than zero")]
    ZeroDeposit,
    #[msg("the raffle is closed for deposits")]
    RaffleClosed,
    #[msg("the draw time has not arrived yet")]
    TooEarly,
    #[msg("the raffle has no entries")]
    NoEntries,
    #[msg("the winner has already been drawn")]
    AlreadyDrawn,
    #[msg("the winner has not been drawn yet")]
    NotDrawn,
    #[msg("the prize has already been claimed")]
    AlreadyClaimed,
    #[msg("this entry is not the winning entry")]
    NotWinner,
    #[msg("arithmetic overflow")]
    Overflow,
}
