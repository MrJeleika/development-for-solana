use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Stake<'info> {
    // TODO: add the accounts this instruction needs.
}

pub fn stake(_ctx: Context<Stake>, _amount: u64) -> Result<()> {
    // TODO: implement.
    todo!()
}
