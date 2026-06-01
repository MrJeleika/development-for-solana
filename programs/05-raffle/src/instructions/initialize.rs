use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::{RAFFLE_SEED, VAULT_SEED};
use crate::state::{Raffle, Randomness};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Raffle::INIT_SPACE,
        seeds = [RAFFLE_SEED],
        bump,
    )]
    pub raffle: Account<'info, Raffle>,

    // The prize pool: a PDA token account owned by the raffle.
    #[account(
        init,
        payer = payer,
        seeds = [VAULT_SEED],
        bump,
        token::mint = mint,
        token::authority = raffle,
    )]
    pub vault: Account<'info, TokenAccount>,

    // The given VRF result account; record the trusted oracle in it now.
    #[account(
        init,
        payer = payer,
        space = 8 + Randomness::INIT_SPACE,
        seeds = [b"randomness"],
        bump,
    )]
    pub randomness: Account<'info, Randomness>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>, draw_time: i64, oracle: Pubkey) -> Result<()> {
    ctx.accounts.raffle.set_inner(Raffle {
        mint: ctx.accounts.mint.key(),
        draw_time,
        total_weight: 0,
        claimed: false,
        entries: Vec::new(),
    });
    ctx.accounts.randomness.set_inner(Randomness {
        oracle,
        value: [0; 32],
        fulfilled: false,
    });
    Ok(())
}
