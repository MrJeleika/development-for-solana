import { PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  AccountLayout,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { assert } from "chai";

import { sendIxs, findPDA, oneToken, expectReverted, numToHex } from "../helpers";
import { setupAirdrop, MerkleFixture } from "./fixture";
import { buildClaimSignatureIx } from "./signatures";

describe("04-merkle-airdrop", () => {
  let env: MerkleFixture;

  const claimPda = (claimant: PublicKey): PublicKey =>
    findPDA(["claim", claimant], env.program)[0];

  const ataBalance = async (ata: PublicKey): Promise<string> => {
    const acc = await env.context.banksClient.getAccount(ata);
    return AccountLayout.decode(acc!.data).amount.toString();
  };

  before(async () => {
    env = await setupAirdrop();
  });

  it("claims an allocation with a valid Merkle proof", async () => {
    const { context, program, mint, vault, entries, tree, claimants } = env;

    const claimant = claimants[0];
    const amount = entries[0].amount;
    const proof = tree.getProof(0).map((node) => [...node]);
    const claimantAta = getAssociatedTokenAddressSync(mint, claimant.publicKey);

    const ix = await program.methods
      .claim(amount, proof)
      .accountsPartial({
        claim: claimPda(claimant.publicKey),
        claimant: claimant.publicKey,
        claimantAta,
        mint,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
    await sendIxs(context, [claimant], ix);

    assert.equal(await ataBalance(claimantAta), amount.toString());
  });

  it("claims with a signature from the trusted signer", async () => {
    const { context, program, mint, vault, signer, claimants } = env;

    const claimant = claimants[1];
    const amount = oneToken();
    const claimantAta = getAssociatedTokenAddressSync(mint, claimant.publicKey);

    const sigIx = buildClaimSignatureIx(
      signer,
      claimant.publicKey,
      amount,
      program.programId,
    );
    const claimIx = await program.methods
      .claimWithSignature(amount)
      .accountsPartial({
        claim: claimPda(claimant.publicKey),
        claimant: claimant.publicKey,
        claimantAta,
        mint,
        vault,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    // The Ed25519 instruction must come first; the program reads it back.
    await sendIxs(context, [claimant], sigIx, claimIx);

    assert.equal(await ataBalance(claimantAta), amount.toString());
  });

  it("rejects a second claim by an account that already claimed", async () => {
    const { context, program, mint, vault, signer, claimants } = env;

    // claimants[0] already claimed via the Merkle path.
    const claimant = claimants[0];
    const amount = oneToken();
    const claimantAta = getAssociatedTokenAddressSync(mint, claimant.publicKey);

    const sigIx = buildClaimSignatureIx(
      signer,
      claimant.publicKey,
      amount,
      program.programId,
    );
    const claimIx = await program.methods
      .claimWithSignature(amount)
      .accountsPartial({
        claim: claimPda(claimant.publicKey),
        claimant: claimant.publicKey,
        claimantAta,
        mint,
        vault,
        instructionsSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    let threw = false;
    try {
      await sendIxs(context, [claimant], sigIx, claimIx);
    } catch {
      threw = true;
    }
    assert.isTrue(threw, "a repeat claim must fail (the claim PDA already exists)");
  });

  it("rejects a Merkle claim with a tampered amount", async () => {
    const { context, program, mint, vault, tree, claimants } = env;

    const claimant = claimants[2];
    const proof = tree.getProof(2).map((node) => [...node]);
    const wrongAmount = oneToken().muln(5);
    const claimantAta = getAssociatedTokenAddressSync(mint, claimant.publicKey);

    const ix = await program.methods
      .claim(wrongAmount, proof)
      .accountsPartial({
        claim: claimPda(claimant.publicKey),
        claimant: claimant.publicKey,
        claimantAta,
        mint,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    // InvalidProof is the first error variant → 6000 → 0x1770.
    await expectReverted(
      { revertedWith: { message: numToHex(6000) } },
      sendIxs(context, [claimant], ix),
    );
  });
});
