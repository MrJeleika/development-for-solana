import { BN, Program } from "@coral-xyz/anchor";
import { ProgramTestContext } from "solana-bankrun";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

import { Raffle } from "../../target/types/raffle";
import idl from "../../target/idl/raffle.json";
import {
  initBankrun,
  createMintAndFund,
  processTransaction,
  sendIxs,
  oneToken,
  findPDA,
  getTime,
} from "../helpers";

export interface Entrant {
  keypair: Keypair;
  ata: PublicKey;
  weight: BN;
}

export interface RaffleFixture {
  context: ProgramTestContext;
  program: Program<Raffle>;
  payer: Keypair;
  mint: PublicKey;
  raffle: PublicKey;
  vault: PublicKey;
  randomness: PublicKey;
  oracle: Keypair;
  drawTime: BN;
  entrants: Entrant[];
}

export const setupRaffle = async (): Promise<RaffleFixture> => {
  const { context, program, accounts } = await initBankrun(idl as Raffle);
  const payer = context.payer;
  const oracle = Keypair.generate();

  const raffle = findPDA(["raffle"], program)[0];
  const vault = findPDA(["vault"], program)[0];
  const randomness = findPDA(["randomness"], program)[0];

  const { mint } = await createMintAndFund(
    context,
    payer,
    payer.publicKey,
    oneToken(),
  );

  // Two entrants with different weights → odds 1:3.
  const weights = [oneToken(), oneToken().muln(3)];
  const entrants: Entrant[] = [];
  for (let i = 0; i < weights.length; i++) {
    const keypair = accounts[i];
    const ata = getAssociatedTokenAddressSync(mint, keypair.publicKey);
    await sendIxs(
      context,
      [payer],
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        ata,
        keypair.publicKey,
        mint,
      ),
      createMintToInstruction(
        mint,
        ata,
        payer.publicKey,
        BigInt(weights[i].toString()),
      ),
    );
    entrants.push({ keypair, ata, weight: weights[i] });
  }

  const drawTime = new BN((await getTime(context)).toString()).addn(3600);

  const initIx = await program.methods
    .initialize(drawTime, oracle.publicKey)
    .accountsPartial({ mint, payer: payer.publicKey, tokenProgram: TOKEN_PROGRAM_ID })
    .instruction();
  await sendIxs(context, [payer], initIx);

  // The vault is funded by deposits — the deposits ARE the pot.
  return { context, program, payer, mint, raffle, vault, randomness, oracle, drawTime, entrants };
};

/** Build + send a deposit for `entrant`. */
export const deposit = async (env: RaffleFixture, entrant: Entrant) => {
  const { context, program, mint, raffle, vault } = env;
  const ix = await program.methods
    .deposit(entrant.weight)
    .accountsPartial({
      raffle,
      vault,
      depositorAta: entrant.ata,
      mint,
      depositor: entrant.keypair.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .instruction();
  await processTransaction(context, new Transaction().add(ix), [entrant.keypair]);
};

/**
 * Mock the oracle's VRF callback: deliver `value` (32 bytes). `payer` covers the
 * fee; `oracle` signs to satisfy the program's trusted-oracle check.
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
