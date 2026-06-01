use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ClaimMerkle<'info> {
    // TODO: add the accounts this instruction needs.
}

pub fn claim(_ctx: Context<ClaimMerkle>, _amount: u64, _proof: Vec<[u8; 32]>) -> Result<()> {
    // TODO: implement.
    todo!()
}
