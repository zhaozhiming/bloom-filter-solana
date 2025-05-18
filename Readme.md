# Bloom Filter Solana

A Solana program that implements a Bloom filter data structure on-chain. This probabilistic data structure is optimized for efficient testing of whether an element is a member of a set, with potential false positives but no false negatives.

## Overview

This program provides a Bloom filter implementation on Solana blockchain with the following features:

- Initialize a new Bloom filter with configurable size and number of hash functions
- Add elements to the filter
- Check if elements are possibly in the filter
- Automatic calculation of false positive rate

## Technology Stack

- Solana blockchain
- Anchor framework
- Rust programming language
- TypeScript for testing

## Program Instructions

The program supports three main instructions:

1. **init** - Initialize a new Bloom filter with given parameters
2. **add** - Add data to the Bloom filter
3. **check** - Check if data is possibly in the Bloom filter

## Build and Test

To build and test the program:

```bash
# Install dependencies
yarn install

# Build the program
anchor build

# Test the program
anchor test
```

## Performance Considerations

The program is optimized for Solana's constraints:

- Configurable filter size (up to 10,000 elements)
- Adjustable number of hash functions to balance false positive rate and computational cost
- Performance metrics from tests

## Use Cases

- Efficient membership testing
- Reducing expensive lookups for non-existent data
- Anti-spam and duplicate prevention mechanisms
- Any application requiring fast set membership queries with space efficiency

## License

This project is licensed under the terms in the LICENSE file.

