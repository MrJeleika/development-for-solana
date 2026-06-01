use anchor_lang::prelude::*;

/// Per-claimant "already claimed" marker. One PDA per claimant, shared by both
/// claim paths — its existence is what blocks a second claim.
#[account]
#[derive(InitSpace)]
pub struct Claim {
    pub claimant: Pubkey,
}
