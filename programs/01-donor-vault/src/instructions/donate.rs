use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::constants::{DONATION_SEED, DONOR_SEED, MAX_MESSAGE_LEN, VAULT_SEED};
use crate::error::DonorVaultError;
use crate::state::{Donation, DonorRecord, Vault};

#[derive(Accounts)]
pub struct Donate<'info> {
    #[account(mut, seeds = [VAULT_SEED], bump)]
    pub vault: Account<'info, Vault>,

    #[account(
        init_if_needed,
        payer = donor,
        space = 8 + DonorRecord::INIT_SPACE,
        seeds = [DONOR_SEED, donor.key().as_ref()],
        bump,
    )]
    pub donor_record: Account<'info, DonorRecord>,

    // The next donation's PDA is seeded by the donor's current count, so each
    // donation lands in its own fresh account and indices are contiguous.
    #[account(
        init,
        payer = donor,
        space = 8 + Donation::INIT_SPACE,
        seeds = [DONATION_SEED, donor.key().as_ref(), &donor_record.donation_count.to_le_bytes()],
        bump,
    )]
    pub donation: Account<'info, Donation>,

    #[account(mut)]
    pub donor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Record a donation. The lamports moved in `amount` are the analogue of
/// `msg.value`; they go into the vault, and a new `Donation` account is created
/// to hold this entry. The donor's running total and count are bumped.
pub fn donate(ctx: Context<Donate>, amount: u64, message: String) -> Result<()> {
    require!(amount > 0, DonorVaultError::ZeroDonation);
    require!(
        message.len() <= MAX_MESSAGE_LEN,
        DonorVaultError::MessageTooLong
    );

    // Move the donation into the vault (the equivalent of a payable call).
    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.donor.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        amount,
    )?;

    // Fill the freshly created donation account for this index.
    let donation = &mut ctx.accounts.donation;
    donation.amount = amount;
    donation.timestamp = Clock::get()?.unix_timestamp;
    donation.message = message;

    // Update the donor summary. A zeroed `donor` field means `init_if_needed`
    // just created the record, i.e. this is the address's first donation.
    let record = &mut ctx.accounts.donor_record;
    let first_donation = record.donor == Pubkey::default();
    if first_donation {
        record.donor = ctx.accounts.donor.key();
    }
    record.total = record
        .total
        .checked_add(amount)
        .ok_or(DonorVaultError::Overflow)?;
    record.donation_count = record
        .donation_count
        .checked_add(1)
        .ok_or(DonorVaultError::Overflow)?;

    if first_donation {
        let vault = &mut ctx.accounts.vault;
        vault.unique_donor_count = vault
            .unique_donor_count
            .checked_add(1)
            .ok_or(DonorVaultError::Overflow)?;
    }

    Ok(())
}
