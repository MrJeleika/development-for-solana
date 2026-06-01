use anchor_lang::prelude::*;
use anchor_lang::solana_program::ed25519_program;
use anchor_lang::solana_program::sysvar::instructions::{self, load_instruction_at_checked};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{transfer, Mint, Token, TokenAccount, Transfer};

use crate::constants::{CLAIM_SEED, CONFIG_SEED, VAULT_SEED};
use crate::error::MerkleAirdropError;
use crate::state::{Claim, Config};

#[derive(Accounts)]
pub struct ClaimWithSignature<'info> {
    #[account(seeds = [CONFIG_SEED], bump, has_one = mint)]
    pub config: Account<'info, Config>,

    #[account(mut, seeds = [VAULT_SEED], bump)]
    pub vault: Account<'info, TokenAccount>,

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

    /// CHECK: the Instructions sysvar, pinned by address; read to introspect the
    /// Ed25519 precompile instruction in this transaction.
    #[account(address = instructions::ID)]
    pub instructions_sysvar: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn claim_with_signature(ctx: Context<ClaimWithSignature>, amount: u64) -> Result<()> {
    let claimant = ctx.accounts.claimant.key();

    // The message the trusted signer must have signed: bound to the claimant, the
    // amount, and this program, so a signature can't be reused for someone else
    // or against another deployment.
    let mut message = Vec::with_capacity(72);
    message.extend_from_slice(claimant.as_ref());
    message.extend_from_slice(&amount.to_le_bytes());
    message.extend_from_slice(crate::ID.as_ref());

    verify_ed25519(
        &ctx.accounts.instructions_sysvar,
        &ctx.accounts.config.signer,
        &message,
    )?;

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

/// Confirm the transaction's first instruction is an Ed25519 precompile call that
/// verified `signer` signing exactly `message`. The precompile itself enforces
/// signature validity — we only bind the pubkey and message.
fn verify_ed25519(ix_sysvar: &AccountInfo, signer: &Pubkey, message: &[u8]) -> Result<()> {
    let ix = load_instruction_at_checked(0, ix_sysvar)
        .map_err(|_| error!(MerkleAirdropError::InvalidSignature))?;
    require_keys_eq!(
        ix.program_id,
        ed25519_program::ID,
        MerkleAirdropError::InvalidSignature
    );

    let data = &ix.data;
    // One signature, then a fixed offsets header (see the Ed25519 precompile).
    require!(
        data.len() >= 16 && data[0] == 1,
        MerkleAirdropError::InvalidSignature
    );
    let pk_off = u16::from_le_bytes([data[6], data[7]]) as usize;
    let msg_off = u16::from_le_bytes([data[10], data[11]]) as usize;
    let msg_len = u16::from_le_bytes([data[12], data[13]]) as usize;
    require!(
        pk_off + 32 <= data.len() && msg_off + msg_len <= data.len(),
        MerkleAirdropError::InvalidSignature
    );
    require!(
        &data[pk_off..pk_off + 32] == signer.as_ref(),
        MerkleAirdropError::InvalidSignature
    );
    require!(
        &data[msg_off..msg_off + msg_len] == message,
        MerkleAirdropError::InvalidSignature
    );
    Ok(())
}
