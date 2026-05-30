import { Program, BN } from "@coral-xyz/anchor";
import { BankrunProvider } from "anchor-bankrun";
import { startAnchor, ProgramTestContext } from "solana-bankrun";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

import { DonorVault } from "../target/types/donor_vault";
import idl from "../target/idl/donor_vault.json";

const VAULT_SEED = Buffer.from("vault");
const DONOR_SEED = Buffer.from("donor");
const DONATION_SEED = Buffer.from("donation");

const TENTH_SOL = new BN(100_000_000); // 0.1 SOL

describe("01-donor-vault", () => {
  let context: ProgramTestContext;
  let provider: BankrunProvider;
  let program: Program<DonorVault>;
  let payer: Keypair;

  let vault: PublicKey;

  function donorRecord(donor: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [DONOR_SEED, donor.toBuffer()],
      program.programId,
    )[0];
  }

  function donationPda(donor: PublicKey, index: number): PublicKey {
    const indexLe = new BN(index).toArrayLike(Buffer, "le", 8);
    return PublicKey.findProgramAddressSync(
      [DONATION_SEED, donor.toBuffer(), indexLe],
      program.programId,
    )[0];
  }

  // Create a funded keypair the bank knows about, so it can sign + pay rent.
  function fundedDonor(lamports = 2_000_000_000): Keypair {
    const kp = Keypair.generate();
    context.setAccount(kp.publicKey, {
      lamports,
      data: Buffer.alloc(0),
      owner: SystemProgram.programId,
      executable: false,
      rentEpoch: 0,
    });
    return kp;
  }

  // Send one donation, deriving the donation PDA from `index`.
  async function donate(
    donor: Keypair,
    index: number,
    amount: BN,
    message: string,
  ) {
    await program.methods
      .donate(amount, message)
      .accounts({
        vault,
        donorRecord: donorRecord(donor.publicKey),
        donation: donationPda(donor.publicKey, index),
        donor: donor.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([donor])
      .rpc();
  }

  // tier_of is the only on-chain getter (a computed value); everything else is
  // read by fetching the account directly.
  async function tierOf(donor: PublicKey) {
    return program.methods
      .tierOf()
      .accounts({ donor, donorRecord: donorRecord(donor) })
      .view();
  }

  before(async () => {
    context = await startAnchor("", [], []);
    provider = new BankrunProvider(context);
    program = new Program<DonorVault>(idl as DonorVault, provider);
    payer = context.payer;

    [vault] = PublicKey.findProgramAddressSync([VAULT_SEED], program.programId);

    await program.methods
      .initialize()
      .accounts({
        vault,
        payer: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  });

  it("starts with zero unique donors", async () => {
    const v = await program.account.vault.fetch(vault);
    assert.equal(v.uniqueDonorCount.toNumber(), 0);
  });

  it("records a donation and classifies a tiny donor as Bronze", async () => {
    await donate(payer, 0, new BN(1), "first gift");

    assert.property(await tierOf(payer.publicKey), "bronze");

    const rec = await program.account.donorRecord.fetch(
      donorRecord(payer.publicKey),
    );
    assert.equal(rec.total.toNumber(), 1);
    assert.equal(rec.donationCount.toNumber(), 1);

    const donation = await program.account.donation.fetch(
      donationPda(payer.publicKey, 0),
    );
    assert.equal(donation.amount.toNumber(), 1);
    assert.equal(donation.message, "first gift");

    const v = await program.account.vault.fetch(vault);
    assert.equal(v.uniqueDonorCount.toNumber(), 1);
  });

  it("does not double-count a repeat donor, and accumulates the total", async () => {
    await donate(payer, 1, new BN(9), "second gift");

    const rec = await program.account.donorRecord.fetch(
      donorRecord(payer.publicKey),
    );
    assert.equal(rec.donationCount.toNumber(), 2);
    assert.equal(rec.total.toNumber(), 10);

    // Each donation kept its own account.
    const second = await program.account.donation.fetch(
      donationPda(payer.publicKey, 1),
    );
    assert.equal(second.message, "second gift");

    const v = await program.account.vault.fetch(vault);
    assert.equal(v.uniqueDonorCount.toNumber(), 1, "repeat donor must not bump the count");
  });

  it("counts a second distinct donor and applies the Silver boundary", async () => {
    const donor = fundedDonor();

    // Exactly 0.1 SOL is the first amount that counts as Silver (not Bronze).
    await donate(donor, 0, TENTH_SOL, "to silver");

    assert.property(await tierOf(donor.publicKey), "silver");

    const v = await program.account.vault.fetch(vault);
    assert.equal(v.uniqueDonorCount.toNumber(), 2);
  });

  it("rejects a zero donation", async () => {
    try {
      await donate(payer, 2, new BN(0), "nothing");
      assert.fail("expected the zero donation to revert");
    } catch (err: any) {
      assert.match(String(err), /ZeroDonation/i);
    }
  });
});
