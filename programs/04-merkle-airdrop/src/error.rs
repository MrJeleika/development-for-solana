use anchor_lang::prelude::*;

#[error_code]
pub enum MerkleAirdropError {
    #[msg("invalid Merkle proof")]
    InvalidProof,
    #[msg("invalid or missing Ed25519 signature")]
    InvalidSignature,
}
