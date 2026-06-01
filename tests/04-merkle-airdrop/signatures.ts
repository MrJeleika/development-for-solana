import { BN } from "@coral-xyz/anchor";
import {
  Ed25519Program,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";

// Build the Ed25519 precompile instruction that authorizes `claimant` to claim
// `amount`, signed by `signer`. The message binds the claimant, the amount, and
// the program, so the signature can't be reused for another recipient or another
// deployment. `claim_with_signature` reads this instruction back via the
// Instructions sysvar — put it first in the transaction.
export const buildClaimSignatureIx = (
  signer: Keypair,
  claimant: PublicKey,
  amount: BN,
  programId: PublicKey,
): TransactionInstruction => {
  const message = Buffer.concat([
    claimant.toBuffer(),
    amount.toArrayLike(Buffer, "le", 8),
    programId.toBuffer(),
  ]);
  return Ed25519Program.createInstructionWithPrivateKey({
    privateKey: signer.secretKey,
    message,
  });
};
