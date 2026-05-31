import { BN } from "@coral-xyz/anchor";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { ProgramTestContext } from "solana-bankrun";

import { processTransaction } from "./bankrun";
import { toBN } from "./bn";

/** Default decimals for test SPL mints. */
export const DEFAULT_DECIMALS = 6;

/** One whole token in base units — e.g. `oneToken()` = 1_000_000 at 6 decimals. */
export const oneToken = (decimals = DEFAULT_DECIMALS) => toBN(10 ** decimals);

/**
 * Create a fresh SPL-Token mint (authority = `payer`) and mint `amount` base
 * units of it to `owner`'s associated token account. Returns the mint and ATA.
 */
export const createMintAndFund = async (
  context: ProgramTestContext,
  payer: Keypair,
  owner: PublicKey,
  amount: BN,
  decimals = DEFAULT_DECIMALS,
): Promise<{ mint: PublicKey; ata: PublicKey }> => {
  const mint = Keypair.generate();
  const ata = getAssociatedTokenAddressSync(mint.publicKey, owner);

  const rent = await context.banksClient.getRent();
  const lamports = Number(rent.minimumBalance(BigInt(MINT_SIZE)));

  await processTransaction(
    context,
    new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMint2Instruction(
        mint.publicKey,
        decimals,
        payer.publicKey,
        null,
      ),
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        ata,
        owner,
        mint.publicKey,
      ),
      createMintToInstruction(
        mint.publicKey,
        ata,
        payer.publicKey,
        BigInt(amount.toString()),
      ),
    ),
    [payer, mint],
  );

  return { mint: mint.publicKey, ata };
};
