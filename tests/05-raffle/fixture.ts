import { Program } from "@coral-xyz/anchor";
import { ProgramTestContext } from "solana-bankrun";
import { Keypair, PublicKey } from "@solana/web3.js";

import { Raffle } from "../../target/types/raffle";
import idl from "../../target/idl/raffle.json";
import {
  initBankrun,
  createMintAndFund,
  sendIxs,
  oneToken,
  findPDA,
} from "../helpers";

export interface RaffleFixture {
  context: ProgramTestContext;
  program: Program<Raffle>;
  payer: Keypair;
  mint: PublicKey;
  // The trusted oracle. In production this is MagicBlock's VRF identity; here
  // it's a key the tests control so they can mock the oracle's callback.
  oracle: Keypair;
  // The given VRF result account (PDA). Your `initialize` must create it.
  randomness: PublicKey;
  // Pre-funded accounts you can use as entrants.
  funded: Keypair[];
}

export const setupRaffle = async (): Promise<RaffleFixture> => {
  const { context, program, accounts } = await initBankrun(idl as Raffle);
  const payer = context.payer;
  const oracle = Keypair.generate();

  const randomness = findPDA(["randomness"], program)[0];
  const { mint } = await createMintAndFund(
    context,
    payer,
    payer.publicKey,
    oneToken(),
  );

  return { context, program, payer, mint, oracle, randomness, funded: accounts };
};

/**
 * Mock the oracle's VRF callback: deliver `value` (32 bytes) as the random
 * result. `payer` covers the fee; `oracle` signs to satisfy the program's
 * trusted-oracle check. (On-chain, `request_randomness` is what triggers this;
 * bankrun has no live VRF program, so the test stands in for the oracle here.)
 */
export const fulfillRandomness = async (
  env: RaffleFixture,
  value: number[],
): Promise<void> => {
  const { context, program, payer, oracle, randomness } = env;
  const ix = await program.methods
    .consumeRandomness(value)
    .accountsPartial({ oracle: oracle.publicKey, randomness })
    .instruction();
  await sendIxs(context, [payer, oracle], ix);
};
