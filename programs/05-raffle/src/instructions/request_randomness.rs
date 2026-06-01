use anchor_lang::prelude::*;
use anchor_lang::Discriminator;
use ephemeral_vrf_sdk::anchor::vrf;
use ephemeral_vrf_sdk::consts::DEFAULT_QUEUE;
use ephemeral_vrf_sdk::instructions::{create_request_randomness_ix, RequestRandomnessParams};
use ephemeral_vrf_sdk::types::SerializableAccountMeta;

use crate::state::Randomness;

// Requests a random value from MagicBlock VRF. The VRF program answers later by
// calling `consume_randomness` back, signed by its identity. The `#[vrf]` macro
// injects the VRF accounts (`program_identity`, `vrf_program`, `slot_hashes`,
// `system_program`) and the `invoke_signed_vrf` helper that signs the request as
// this program's identity PDA.
#[vrf]
#[derive(Accounts)]
pub struct RequestRandomness<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut, seeds = [b"randomness"], bump)]
    pub randomness: Account<'info, Randomness>,

    /// CHECK: the VRF oracle queue, pinned by address.
    #[account(mut, address = DEFAULT_QUEUE)]
    pub oracle_queue: AccountInfo<'info>,
}

pub fn request_randomness(ctx: Context<RequestRandomness>) -> Result<()> {
    // TODO: gate the draw on your own rules (deadline passed, entries exist, once).

    // Name `consume_randomness` as the callback and forward the `Randomness`
    // account (writable) so the oracle's reply can be written into it.
    let ix = create_request_randomness_ix(RequestRandomnessParams {
        payer: ctx.accounts.payer.key(),
        oracle_queue: ctx.accounts.oracle_queue.key(),
        callback_program_id: crate::ID,
        callback_discriminator: crate::instruction::ConsumeRandomness::DISCRIMINATOR.to_vec(),
        caller_seed: ctx.accounts.randomness.key().to_bytes(),
        accounts_metas: Some(vec![SerializableAccountMeta {
            pubkey: ctx.accounts.randomness.key(),
            is_signer: false,
            is_writable: true,
        }]),
        ..Default::default()
    });
    ctx.accounts
        .invoke_signed_vrf(&ctx.accounts.payer.to_account_info(), &ix)?;
    Ok(())
}
