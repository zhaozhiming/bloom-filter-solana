use anchor_lang::prelude::*;
use crate::state::BloomFilter;

#[derive(Accounts)]
pub struct Update<'info> {
    pub user: Signer<'info>,

    #[account(mut)]
    pub filter: Box<Account<'info, BloomFilter>>,
}

pub fn add(ctx: Context<Update>, data: Vec<u8>) -> Result<()> {
    // add an element to the filter
    let filter = &mut ctx.accounts.filter;
    filter.add(&data)?;

    Ok(())
}
