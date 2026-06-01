use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

use crate::constants::{RAFFLE_SEED, VAULT_SEED};
use crate::error::RaffleError;
use crate::state::{Raffle, Randomness};

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    #[account(mut, seeds = [RAFFLE_SEED], bump)]
    pub raffle: Account<'info, Raffle>,

    #[account(mut, seeds = [VAULT_SEED], bump)]
    pub vault: Account<'info, TokenAccount>,

    #[account(seeds = [b"randomness"], bump)]
    pub randomness: Account<'info, Randomness>,

    #[account(mut, token::mint = raffle.mint, token::authority = winner)]
    pub winner_ata: Account<'info, TokenAccount>,

    pub winner: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn claim(ctx: Context<ClaimPrize>) -> Result<()> {
    require!(ctx.accounts.randomness.fulfilled, RaffleError::NotDrawn);
    require!(!ctx.accounts.raffle.claimed, RaffleError::AlreadyClaimed);

    let value = ctx.accounts.randomness.value;
    let r = u64::from_le_bytes(value[0..8].try_into().unwrap());
    let ticket = r % ctx.accounts.raffle.total_weight;

    // Walk the entries, accumulating weight, until we reach the ticket's bucket.
    let mut cumulative: u64 = 0;
    let mut winner: Option<Pubkey> = None;
    for entry in ctx.accounts.raffle.entries.iter() {
        let next = cumulative + entry.weight;
        if ticket >= cumulative && ticket < next {
            winner = Some(entry.depositor);
            break;
        }
        cumulative = next;
    }
    let winner = winner.ok_or(RaffleError::NotWinner)?;
    require_keys_eq!(winner, ctx.accounts.winner.key(), RaffleError::NotWinner);

    let pot = ctx.accounts.vault.amount;
    let bump = ctx.bumps.raffle;
    let signer_seeds: &[&[&[u8]]] = &[&[RAFFLE_SEED, &[bump]]];
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.winner_ata.to_account_info(),
                authority: ctx.accounts.raffle.to_account_info(),
            },
            signer_seeds,
        ),
        pot,
    )?;

    ctx.accounts.raffle.claimed = true;
    Ok(())
}
