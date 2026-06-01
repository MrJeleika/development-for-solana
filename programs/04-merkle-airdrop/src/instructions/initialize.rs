use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    // TODO: add the accounts this instruction needs.
}

pub fn initialize(
    _ctx: Context<Initialize>,
    _merkle_root: [u8; 32],
    _signer: Pubkey,
) -> Result<()> {
    // TODO: implement.
    todo!()
}
