import { Keypair, PublicKey } from "@solana/web3.js";
import { ProgramTestContext } from "solana-bankrun";

/**
 * TODO(you): create the vRDDK mint and return its address. It must be
 * non-transferable, with mint authority = `mintAuthority`.
 */
export const createVrddkMint = async (
  _context: ProgramTestContext,
  _payer: Keypair,
  _mintAuthority: PublicKey,
  _decimals: number,
): Promise<PublicKey> => {
  throw new Error("TODO: create the vRDDK Token-2022 non-transferable mint");
};
