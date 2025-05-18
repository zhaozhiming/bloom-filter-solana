use anchor_lang::prelude::*;

#[error_code]
pub enum BloomFilterError {
    #[msg("Element definitely not in the set")]
    ElementNotFound,
    #[msg("Invalid filter parameters")]
    InvalidParameters,
    #[msg("Filter size is too large")]
    FilterTooLarge,
}
