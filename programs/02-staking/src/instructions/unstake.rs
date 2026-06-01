use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Unstake<'info> {
    // TODO: add the accounts this instruction needs.
}

pub fn unstake(_ctx: Context<Unstake>, _amount: u64) -> Result<()> {
    // TODO: implement.
    todo!()
}
