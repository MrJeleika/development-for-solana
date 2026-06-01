use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Mint, Token, TokenAccount, Transfer};

use crate::constants::{RAFFLE_SEED, VAULT_SEED};
use crate::error::RaffleError;
use crate::state::{EntryData, Raffle};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut, seeds = [RAFFLE_SEED], bump, has_one = mint)]
    pub raffle: Account<'info, Raffle>,

    #[account(mut, seeds = [VAULT_SEED], bump)]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut, token::mint = mint, token::authority = depositor)]
    pub depositor_ata: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(amount > 0, RaffleError::ZeroDeposit);

    let now = Clock::get()?.unix_timestamp;
    require!(now < ctx.accounts.raffle.draw_time, RaffleError::RaffleClosed);

    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.depositor_ata.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.depositor.to_account_info(),
            },
        ),
        amount,
    )?;

    let raffle = &mut ctx.accounts.raffle;
    raffle.total_weight = raffle
        .total_weight
        .checked_add(amount)
        .ok_or(RaffleError::Overflow)?;
    raffle.entries.push(EntryData {
        depositor: ctx.accounts.depositor.key(),
        weight: amount,
    });
    Ok(())
}
