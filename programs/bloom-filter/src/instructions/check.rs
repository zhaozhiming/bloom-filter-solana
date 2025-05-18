use anchor_lang::prelude::*;
use crate::state::BloomFilter;

#[derive(Accounts)]
pub struct Check<'info> {
    pub user: Signer<'info>,

    #[account()]
    pub filter: Box<Account<'info, BloomFilter>>,
}

pub fn check(ctx: Context<Check>, data: Vec<u8>) -> Result<()> {
    // check if an element is in the filter
    let filter = &ctx.accounts.filter;
    filter.check(&data)?;

    Ok(())
}
