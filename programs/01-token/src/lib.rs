use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Burn, Mint, MintTo, Token, TokenAccount},
};

declare_id!("GhAdtT9Vd5Gst89DyG8jShfgygJUdNcoQGGS5fGyZUVT");

// Academy Token — the Solana/Anchor counterpart of the ERC-20 task.
//
// On Ethereum a token is its own contract holding a balance ledger. On Solana
// the SPL Token program already is that ledger; a "token" is just a `Mint`
// account, and balances live in per-owner `TokenAccount`s. So this program does
// not re-implement the ledger — instead it owns a mint (via a PDA mint
// authority) and exposes the privileged operations: create the mint with an
// initial supply, mint more (owner only), and burn.
#[program]
pub mod token {
    use super::*;

    /// Create the program-owned mint and credit `initial_supply` to the
    /// creator's associated token account. Mirrors the ERC-20 constructor.
    pub fn initialize(
        ctx: Context<Initialize>,
        _decimals: u8,
        initial_supply: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.owner = ctx.accounts.payer.key();
        config.mint = ctx.accounts.mint.key();
        config.bump = ctx.bumps.config;

        if initial_supply > 0 {
            let signer_seeds: &[&[&[u8]]] = &[&[CONFIG_SEED, &[config.bump]]];
            token::mint_to(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    MintTo {
                        mint: ctx.accounts.mint.to_account_info(),
                        to: ctx.accounts.destination.to_account_info(),
                        authority: ctx.accounts.config.to_account_info(),
                    },
                    signer_seeds,
                ),
                initial_supply,
            )?;
        }

        Ok(())
    }

    /// Mint new tokens to `recipient`. Owner-only (enforced by `has_one`).
    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        require!(amount > 0, TokenError::ZeroAmount);

        let bump = ctx.accounts.config.bump;
        let signer_seeds: &[&[&[u8]]] = &[&[CONFIG_SEED, &[bump]]];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: ctx.accounts.config.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;

        Ok(())
    }

    /// Burn `amount` tokens from the caller's own token account.
    pub fn burn_tokens(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        require!(amount > 0, TokenError::ZeroAmount);

        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.from.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }
}

pub const CONFIG_SEED: &[u8] = b"config";
pub const MINT_SEED: &[u8] = b"mint";

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub bump: u8,
}

#[derive(Accounts)]
#[instruction(decimals: u8)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = payer,
        seeds = [MINT_SEED],
        bump,
        mint::decimals = decimals,
        mint::authority = config,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub destination: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = owner @ TokenError::Unauthorized,
        has_one = mint,
    )]
    pub config: Account<'info, Config>,

    #[account(mut, seeds = [MINT_SEED], bump)]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub destination: Account<'info, TokenAccount>,

    /// CHECK: only used to derive the recipient's associated token account.
    pub recipient: UncheckedAccount<'info>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(seeds = [CONFIG_SEED], bump = config.bump, has_one = mint)]
    pub config: Account<'info, Config>,

    #[account(mut, seeds = [MINT_SEED], bump)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = owner,
    )]
    pub from: Account<'info, TokenAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum TokenError {
    #[msg("amount must be greater than zero")]
    ZeroAmount,
    #[msg("only the owner can perform this action")]
    Unauthorized,
}
