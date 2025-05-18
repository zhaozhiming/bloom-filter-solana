use anchor_lang::prelude::*;
use solana_program::log::sol_log_compute_units;
use crate::state::{BloomFilter, NewFilter, BLOOM_FILTER_NAME};

#[derive(Accounts)]
#[instruction(new_filter: NewFilter)]
pub struct Init<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + BloomFilter::INIT_SPACE,
        seeds = [
            BLOOM_FILTER_NAME.as_bytes(),
            user.key().as_ref(),
            new_filter.name.as_bytes()
        ],
        bump
    )]
    pub filter: Box<Account<'info, BloomFilter>>,

    pub system_program: Program<'info, System>,
}

pub fn init(ctx: Context<Init>, new_filter: NewFilter) -> Result<()> {
    // validate the filter parameters
    new_filter.validate()?;

    // initialize the bloom filter
    let filter = &mut ctx.accounts.filter;
    filter.init(new_filter)?;
    msg!("init bloom filter");
    sol_log_compute_units();

    Ok(())
}
