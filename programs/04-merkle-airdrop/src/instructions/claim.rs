use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hashv;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{transfer, Mint, Token, TokenAccount, Transfer};

use crate::constants::{CLAIM_SEED, CONFIG_SEED, VAULT_SEED};
use crate::error::MerkleAirdropError;
use crate::state::{Claim, Config};

#[derive(Accounts)]
pub struct ClaimMerkle<'info> {
    #[account(seeds = [CONFIG_SEED], bump, has_one = mint)]
    pub config: Account<'info, Config>,

    #[account(mut, seeds = [VAULT_SEED], bump)]
    pub vault: Account<'info, TokenAccount>,

    // `init` doubles as the double-claim guard: a second claim (by either path)
    // fails because this PDA already exists.
    #[account(
        init,
        payer = claimant,
        space = 8 + Claim::INIT_SPACE,
        seeds = [CLAIM_SEED, claimant.key().as_ref()],
        bump,
    )]
    pub claim: Account<'info, Claim>,

    #[account(
        init_if_needed,
        payer = claimant,
        associated_token::mint = mint,
        associated_token::authority = claimant,
    )]
    pub claimant_ata: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub claimant: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn claim(ctx: Context<ClaimMerkle>, amount: u64, proof: Vec<[u8; 32]>) -> Result<()> {
    let claimant = ctx.accounts.claimant.key();

    // Recompute this claimant's leaf and fold the proof up to the root.
    let leaf = hashv(&[claimant.as_ref(), &amount.to_le_bytes()]).to_bytes();
    require!(
        verify_proof(&proof, ctx.accounts.config.merkle_root, leaf),
        MerkleAirdropError::InvalidProof
    );

    ctx.accounts.claim.claimant = claimant;

    let bump = ctx.bumps.config;
    let signer_seeds: &[&[&[u8]]] = &[&[CONFIG_SEED, &[bump]]];
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.claimant_ata.to_account_info(),
                authority: ctx.accounts.config.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;
    Ok(())
}

/// Fold `leaf` with each proof node (hashing the sorted pair) and check the root.
fn verify_proof(proof: &[[u8; 32]], root: [u8; 32], leaf: [u8; 32]) -> bool {
    let mut computed = leaf;
    for node in proof {
        computed = if computed <= *node {
            hashv(&[&computed, node]).to_bytes()
        } else {
            hashv(&[node, &computed]).to_bytes()
        };
    }
    computed == root
}
