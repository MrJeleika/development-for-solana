use anchor_lang::prelude::*;

/// Singleton airdrop config: the token, the Merkle root of `(account, amount)`
/// leaves, and the trusted signer for the signature claim path.
#[account]
#[derive(InitSpace)]
pub struct Config {
    pub mint: Pubkey,
    pub merkle_root: [u8; 32],
    pub signer: Pubkey,
}
