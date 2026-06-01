use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Deposit<'info> {
    // TODO: add the accounts this instruction needs.
}

pub fn deposit(_ctx: Context<Deposit>, _amount: u64) -> Result<()> {
    // TODO: implement.
    todo!()
}
