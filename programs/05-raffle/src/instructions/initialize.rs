use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    // TODO: add the accounts this instruction needs. One of them must be the
    // `Randomness` account — create it and store `oracle` in it.
}

pub fn initialize(_ctx: Context<Initialize>, _draw_time: i64, _oracle: Pubkey) -> Result<()> {
    // TODO: implement.
    todo!()
}
