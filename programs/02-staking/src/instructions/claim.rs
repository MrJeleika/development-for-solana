use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Claim<'info> {
    // TODO: add the accounts this instruction needs.
}

pub fn claim(_ctx: Context<Claim>, _index: u64) -> Result<()> {
    // TODO: implement.
    todo!()
}
