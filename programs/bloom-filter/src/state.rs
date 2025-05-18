use crate::errors::BloomFilterError;
use anchor_lang::prelude::*;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

pub const MAX_FILTER_SIZE: usize = 10000;
pub const BLOOM_FILTER_NAME: &str = "bloom-filter";

#[account]
#[derive(InitSpace)]
pub struct BloomFilter {
    // filter name
    #[max_len(32)]
    pub name: String,
    // the bit array
    #[max_len(MAX_FILTER_SIZE)]
    pub bit_array: Vec<bool>,
    // size of the bit array
    pub m: u32,
    // number of hash functions
    pub k: u8,
    // number of elements in the filter
    pub n: u32,
    // false positive rate
    pub false_positive_rate: f64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct NewFilter {
    pub name: String,
    pub size: u32,
    pub num_hashes: u8,
}

impl BloomFilter {
    // initialize the bloom filter
    pub fn init(&mut self, new_filter: NewFilter) -> Result<()> {
        self.bit_array = vec![false; new_filter.size as usize];
        self.name = new_filter.name.clone();
        self.m = new_filter.size;
        self.k = new_filter.num_hashes;
        self.n = 0;
        self.false_positive_rate = 0.0;

        Ok(())
    }

    // calculate hash indices
    fn get_indices(&self, data: &[u8]) -> Vec<u32> {
        let mut indices = Vec::with_capacity(self.k as usize);

        for i in 0..self.k {
            let mut hasher = DefaultHasher::new();
            // use data and index as hash input
            data.hash(&mut hasher);
            i.hash(&mut hasher);
            let hash = hasher.finish();

            // map hash value to bloom filter size range
            indices.push((hash % self.m as u64) as u32);
        }

        indices
    }

    // calculate false positive rate
    fn update_false_positive_rate(&mut self) {
        // calculate false positive rate: (1 - e^(-k*n/m))^k
        // where: k is the number of hash functions, n is the number of elements added, m is the size of the bit array
        let k = f64::from(self.k);
        let n = f64::from(self.n);
        let m = f64::from(self.m);

        let inner = 1.0 - (-k * n / m).exp();
        self.false_positive_rate = inner.powf(k);
    }

    // add an element to the filter
    pub fn add(&mut self, data: &[u8]) -> Result<()> {
        let indices = self.get_indices(data);
        // check if the element is already in the filter, if it is, return
        if self.check_indices(&indices).is_ok() {
            return Ok(());
        }

        for index in indices {
            self.bit_array[index as usize] = true;
        }

        self.n += 1;
        self.update_false_positive_rate();

        Ok(())
    }

    // check if an element might be in the filter
    pub fn check(&self, data: &[u8]) -> Result<()> {
        let indices = self.get_indices(data);
        self.check_indices(&indices)?;

        Ok(())
    }

    fn check_indices(&self, indices: &[u32]) -> Result<()> {
        if !indices
            .into_iter()
            .all(|index| self.bit_array[*index as usize])
        {
            return err!(BloomFilterError::ElementNotFound);
        }
        Ok(())
    }
}

impl NewFilter {
    pub fn validate(&self) -> Result<()> {
        if self.size == 0 || self.num_hashes == 0 {
            return err!(BloomFilterError::InvalidParameters);
        }

        if self.size as usize > MAX_FILTER_SIZE {
            return err!(BloomFilterError::FilterTooLarge);
        }

        Ok(())
    }
}
