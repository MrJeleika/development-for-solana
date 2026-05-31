import { Program } from "@coral-xyz/anchor";
import { ProgramTestContext } from "solana-bankrun";
import { Keypair, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

import { Staking } from "../../target/types/staking";
import idl from "../../target/idl/staking.json";
import {
  initBankrun,
  createMintAndFund,
  sendIxs,
  oneToken,
  findPDA,
  DEFAULT_DECIMALS,
} from "../helpers";
import { createVrddkMint } from "./init-vrddk";

export interface StakingFixture {
  context: ProgramTestContext;
  program: Program<Staking>;
  payer: Keypair;
  // Singleton PDAs.
  config: PublicKey;
  vrddkMint: PublicKey;
  vault: PublicKey;
  // RDDK mint + the payer's funded RDDK token account.
  rddkMint: PublicKey;
  userRddkAta: PublicKey;
}

/**
 * Boot a fresh staking world: bankrun, an RDDK mint funded to the payer, and
 * the program initialized. Returns every handle a test needs so the test files
 * stay focused on behaviour, not setup.
 */
export const setupStaking = async (): Promise<StakingFixture> => {
  const { context, program } = await initBankrun(idl as Staking);
  const payer = context.payer;

  const config = findPDA(["config"], program)[0];
  const vault = findPDA(["vault"], program)[0];

  const { mint: rddkMint, ata: userRddkAta } = await createMintAndFund(
    context,
    payer,
    payer.publicKey,
    oneToken().muln(1000),
  );

  // vRDDK is created on the client with authority = the config PDA.
  // TODO: (You implement `createVrddkMint`.)
  const vrddkMint = await createVrddkMint(
    context,
    payer,
    config,
    DEFAULT_DECIMALS,
  );

  const initIx = await program.methods
    .initialize()
    .accountsPartial({
      rddkMint,
      vrddkMint,
      payer: payer.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      token2022Program: TOKEN_2022_PROGRAM_ID,
    })
    .instruction();
  await sendIxs(context, [payer], initIx);

  return {
    context,
    program,
    payer,
    config,
    vrddkMint,
    vault,
    rddkMint,
    userRddkAta,
  };
};
