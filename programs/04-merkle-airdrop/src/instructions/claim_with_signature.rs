use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ClaimWithSignature<'info> {
    // TODO: add the accounts this instruction needs.
}

pub fn claim_with_signature(_ctx: Context<ClaimWithSignature>, _amount: u64) -> Result<()> {
    // TODO: implement.
    todo!()
}
