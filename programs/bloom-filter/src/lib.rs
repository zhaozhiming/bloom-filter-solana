use anchor_lang::prelude::*;
use instructions::*;
use state::NewFilter;

pub mod state;
pub mod instructions;
pub mod errors;

declare_id!("25vTrRPxj41T6BituXJC3fDh8PxS3Jf14AfzFU44gfCS");

#[program]
pub mod bloom_filter {
    use super::*;

    pub fn init(ctx: Context<Init>, new_filter: NewFilter) -> Result<()> {
        instructions::init(ctx, new_filter)
    }

    pub fn add(ctx: Context<Update>, data: Vec<u8>) -> Result<()> {
        instructions::add(ctx, data)
    }

    pub fn check(ctx: Context<Check>, data: Vec<u8>) -> Result<()> {
        instructions::check(ctx, data)
    }
}
