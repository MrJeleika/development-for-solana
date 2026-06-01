import { Program } from "@coral-xyz/anchor";
import { ProgramTestContext } from "solana-bankrun";
import { Keypair, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMintToInstruction } from "@solana/spl-token";

import { MerkleAirdrop } from "../../target/types/merkle_airdrop";
import idl from "../../target/idl/merkle_airdrop.json";
import {
  initBankrun,
  createMintAndFund,
  sendIxs,
  oneToken,
  findPDA,
} from "../helpers";
import { AirdropEntry, MerkleTree } from "./merkle";

export interface MerkleFixture {
  context: ProgramTestContext;
  program: Program<MerkleAirdrop>;
  payer: Keypair;
  mint: PublicKey;
  config: PublicKey;
  vault: PublicKey;
  signer: Keypair; // the trusted signer for claim_with_signature
  claimants: Keypair[]; // keypairs whose pubkeys are in the tree
  entries: AirdropEntry[];
  tree: MerkleTree;
}

/**
 * Boot the airdrop: bankrun, a funded vault, and `initialize` called with the
 * Merkle root + the trusted signer. Each claimant is owed one token.
 */
export const setupAirdrop = async (): Promise<MerkleFixture> => {
  const { context, program, accounts } = await initBankrun(
    idl as MerkleAirdrop,
  );
  const payer = context.payer;
  const signer = Keypair.generate();

  const claimants = accounts.slice(0, 4);
  const entries: AirdropEntry[] = claimants.map((kp) => ({
    account: kp.publicKey,
    amount: oneToken(),
  }));
  const tree = new MerkleTree(entries);

  const config = findPDA(["config"], program)[0];
  const vault = findPDA(["vault"], program)[0];

  const { mint } = await createMintAndFund(
    context,
    payer,
    payer.publicKey,
    oneToken(),
  );

  const initIx = await program.methods
    .initialize([...tree.root], signer.publicKey)
    .accountsPartial({
      mint,
      payer: payer.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
  await sendIxs(context, [payer], initIx);

  // Fund the vault with enough for every claimant.
  await sendIxs(
    context,
    [payer],
    createMintToInstruction(
      mint,
      vault,
      payer.publicKey,
      BigInt(oneToken().muln(entries.length).toString()),
    ),
  );

  return {
    context,
    program,
    payer,
    mint,
    config,
    vault,
    signer,
    claimants,
    entries,
    tree,
  };
};
