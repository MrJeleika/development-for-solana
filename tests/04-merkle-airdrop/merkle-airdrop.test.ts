import { PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  AccountLayout,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { assert } from "chai";

import { sendIxs } from "../helpers";
import { setupAirdrop, MerkleFixture } from "./fixture";

describe("04-merkle-airdrop", () => {
  let env: MerkleFixture;

  // TODO(you): derive the per-claimant claim PDA (the "already claimed" marker).
  const claimPda = (_claimant: PublicKey): PublicKey => {
    throw new Error("TODO: derive the claim PDA");
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

    const acc = await context.banksClient.getAccount(claimantAta);
    const balance = AccountLayout.decode(acc!.data).amount;
    assert.equal(balance.toString(), amount.toString());
  });
});
