use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::{CONFIG_SEED, VAULT_SEED};
use crate::state::Config;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump,
    )]
    pub config: Account<'info, Config>,

    // The airdrop pool: a PDA token account owned by the config, so only the
    // program can pay out claims.
    #[account(
        init,
        payer = payer,
        seeds = [VAULT_SEED],
        bump,
        token::mint = mint,
        token::authority = config,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>, merkle_root: [u8; 32], signer: Pubkey) -> Result<()> {
    ctx.accounts.config.set_inner(Config {
        mint: ctx.accounts.mint.key(),
        merkle_root,
        signer,
    });
    Ok(())
}
