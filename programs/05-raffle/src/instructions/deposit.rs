use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Mint, Token, TokenAccount, Transfer};

use crate::constants::{ENTRY_SEED, RAFFLE_SEED, VAULT_SEED};
use crate::error::RaffleError;
use crate::state::{Entry, Raffle};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut, seeds = [RAFFLE_SEED], bump, has_one = mint)]
    pub raffle: Account<'info, Raffle>,

    #[account(mut, seeds = [VAULT_SEED], bump)]
    pub vault: Account<'info, TokenAccount>,

    // One account per deposit, seeded by the current entry count so indices are
    // contiguous and each deposit owns a distinct ticket range.
    #[account(
        init,
        payer = depositor,
        space = 8 + Entry::INIT_SPACE,
        seeds = [ENTRY_SEED, &raffle.entry_count.to_le_bytes()],
        bump,
    )]
    pub entry: Account<'info, Entry>,

    #[account(mut, token::mint = mint, token::authority = depositor)]
    pub depositor_ata: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(amount > 0, RaffleError::ZeroDeposit);

    let raffle = &ctx.accounts.raffle;
    let now = Clock::get()?.unix_timestamp;
    require!(now < raffle.draw_time, RaffleError::RaffleClosed);

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

    let start = raffle.total_weight;
    let end = start.checked_add(amount).ok_or(RaffleError::Overflow)?;

    ctx.accounts.entry.set_inner(Entry {
        depositor: ctx.accounts.depositor.key(),
        range_start: start,
        range_end: end,
    });

    let raffle = &mut ctx.accounts.raffle;
    raffle.total_weight = end;
    raffle.entry_count = raffle
        .entry_count
        .checked_add(1)
        .ok_or(RaffleError::Overflow)?;
    Ok(())
}
