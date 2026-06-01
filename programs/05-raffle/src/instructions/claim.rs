use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ClaimPrize<'info> {
    // TODO: add the accounts this instruction needs.
}

pub fn claim(_ctx: Context<ClaimPrize>, _entry_index: u64) -> Result<()> {
    // TODO: implement.
    todo!()
}
