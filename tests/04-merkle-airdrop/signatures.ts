import { BN } from "@coral-xyz/anchor";
import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";

// TODO(you): build the instruction that authorizes `claimant` to claim
// `amount`, signed by `signer`, that your `claim_with_signature` will accept.
// The signed message must bind the claimant, the amount, and this program so a
// signature cannot be reused for another recipient or another deployment.
export const buildClaimSignatureIx = (
  _signer: Keypair,
  _claimant: PublicKey,
  _amount: BN,
  _programId: PublicKey,
): TransactionInstruction => {
  throw new Error("TODO: buildClaimSignatureIx");
};
