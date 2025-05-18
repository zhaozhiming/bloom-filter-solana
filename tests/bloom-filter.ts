import {
  AnchorError,
  AnchorProvider,
  Program,
  setProvider,
  workspace,
} from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { expect } from "chai";
import { v4 as uuidv4 } from "uuid";
import { BloomFilter } from "../target/types/bloom_filter";

const BLOOM_FILTER_NAME = "bloom-filter";
const BLOOM_FILTER_SEED = Buffer.from(BLOOM_FILTER_NAME, "utf-8");

describe("bloom-filter", () => {
  // Solana attributes
  const provider: AnchorProvider = AnchorProvider.local();
  setProvider(provider);
  const connection: Connection = provider.connection;
  const program = workspace.BloomFilter as Program<BloomFilter>;
  let user: Keypair;
  let filterAddress: PublicKey;

  before(async () => {
    user = Keypair.generate();
    const airdropTxSignature = await connection.requestAirdrop(
      user.publicKey,
      LAMPORTS_PER_SOL * 500
    );
    const lastBlockHash = await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      {
        signature: airdropTxSignature,
        blockhash: lastBlockHash.blockhash,
        lastValidBlockHeight: lastBlockHash.lastValidBlockHeight,
      },
      "confirmed"
    );

    const [pda] = PublicKey.findProgramAddressSync(
      [
        BLOOM_FILTER_SEED,
        user.publicKey.toBuffer(),
        Buffer.from(BLOOM_FILTER_NAME, "utf-8"),
      ],
      program.programId
    );
    filterAddress = pda;
  });

  describe("initialize bloom filter", () => {
    it("initialize bloom filter with correct name, size and hash functions", async () => {
      // performance test:
      // 1000 size, 8 numHashes: 65965 CU
      // 2000 size, 8 numHashes: 122965 CU
      // 3000 size, 8 numHashes: 179967 CU
      // 1000 size, 16 numHashes: 65965 CU
      // 1000 size, 32 numHashes: 67465 CU
      // 5000 MAX_FILTER_SIZE: 5065 bytes account size
      // 10000 MAX_FILTER_SIZE: 10065 bytes account size
      const newFilter = {
        name: BLOOM_FILTER_NAME,
        size: 1000,
        numHashes: 32,
      };

      await program.methods
        .init(newFilter)
        .accounts({
          user: user.publicKey,
        })
        .signers([user])
        .rpc();

      const filter = await program.account.bloomFilter.fetch(filterAddress);
      expect(filter.name).to.equal(BLOOM_FILTER_NAME);
      expect(filter.m).to.equal(newFilter.size);
      expect(filter.k).to.equal(newFilter.numHashes);
      const accountInfo = await connection.getAccountInfo(filterAddress);
      console.log("account size:", accountInfo?.data.length);
    });
  });

  describe("add element", () => {
    beforeEach(async () => {
      const newFilter = {
        name: BLOOM_FILTER_NAME,
        size: 2000,
        numHashes: 16,
      };

      await program.methods
        .init(newFilter)
        .accounts({
          user: user.publicKey,
        })
        .signers([user])
        .rpc();
    });

    it("successfully add a single element", async () => {
      // performance test:
      // 1000 size, 8 numHashes: 99756 CU
      // 1000 size, 16 numHashes: 104770 CU
      // 1000 size, 32 numHashes: 114390 CU
      // 2000 size, 8 numHashes: 179865 CU
      // 2000 size, 16 numHashes: 184640 CU
      // 2000 size, 32 numHashes: 194536 CU
      const element = Buffer.from(uuidv4(), "utf-8");
      await program.methods
        .add(element)
        .accounts({
          user: user.publicKey,
          filter: filterAddress,
        })
        .signers([user])
        .rpc();

      const filter = await program.account.bloomFilter.fetch(filterAddress);
      expect(filter.n).to.equal(1);
      expect(filter.falsePositiveRate).to.be.at.most(0.01);
    });
  });

  describe("check element", () => {
    const element = Buffer.from(uuidv4(), "utf-8");

    before(async () => {
      // init bloom filter
      const newFilter = {
        name: BLOOM_FILTER_NAME,
        size: 2000,
        numHashes: 8,
      };

      await program.methods
        .init(newFilter)
        .accounts({
          user: user.publicKey,
        })
        .signers([user])
        .rpc();
    });

    beforeEach(async () => {
      // add element
      await program.methods
        .add(element)
        .accounts({
          user: user.publicKey,
          filter: filterAddress,
        })
        .signers([user])
        .rpc();
    });

    it("should return true if element is in bloom filter", async () => {
      // performance test:
      // 1000 size, 8 numHashes: 29886 CU
      // 2000 size, 8 numHashes: 52886 CU
      // 1000 size, 16 numHashes: 34774 CU
      // 1000 size, 32 numHashes: 44550 CU
      let error = null;
      try {
        await program.methods
          .check(element)
          .accounts({
            user: user.publicKey,
            filter: filterAddress,
          })
          .signers([user])
          .rpc();
      } catch (e) {
        console.log(e);
        error = e;
      }
      expect(error).to.be.null;

      const filter = await program.account.bloomFilter.fetch(filterAddress);
      expect(filter.n).to.equal(1);
      expect(filter.falsePositiveRate).to.be.at.most(0.01);
    });

    it("should failed if element is not in bloom filter", async () => {
      let error: Error | undefined = undefined;
      try {
        await program.methods
          .check(Buffer.from(uuidv4(), "utf-8"))
          .accounts({
            user: user.publicKey,
            filter: filterAddress,
          })
          .signers([user])
          .rpc();
      } catch (err) {
        error = err;
      }

      // Verify the error
      expect(error).not.to.be.undefined;
      expect(error instanceof AnchorError).to.be.true;
      const logs = (error! as any).logs as string[];
      expect(logs).not.to.be.undefined;
      const expectedLog = "Element definitely not in the set";
      expect(logs.some((l) => l.includes(expectedLog))).to.be.true;
    });
  });

  describe.only("performance", () => {
    before(async () => {
      // init bloom filter
      const newFilter = {
        name: BLOOM_FILTER_NAME,
        size: 2000,
        numHashes: 8,
      };

      await program.methods
        .init(newFilter)
        .accounts({
          user: user.publicKey,
        })
        .signers([user])
        .rpc();
    });

    it("performance test", async () => {
      // Add elements with a delay between each call
      for (let i = 0; i < 210; i++) {
        await program.methods
          .add(Buffer.from(`element-${i}`, "utf-8"))
          .accounts({
            user: user.publicKey,
            filter: filterAddress,
          })
          .signers([user])
          .rpc();

        // Wait for 10ms before the next call
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const filter = await program.account.bloomFilter.fetch(filterAddress);
      console.log("filter name", filter.name);
      console.log("filter m", filter.m);
      console.log("filter k", filter.k);
      console.log("filter n", filter.n);
      console.log("filter falsePositiveRate", filter.falsePositiveRate);
    });
  });
});
