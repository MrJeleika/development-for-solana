import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export interface AirdropEntry {
  account: PublicKey;
  amount: BN;
}

// TODO(you): hash one entry into a 32-byte leaf. Must match what the program
// recomputes.
export const hashLeaf = (_entry: AirdropEntry): Buffer => {
  throw new Error("TODO: hashLeaf");
};

export class MerkleTree {
  constructor(_entries: AirdropEntry[]) {
    // TODO: build the tree layers from the leaves up to a single root.
  }

  // TODO: the 32-byte root.
  get root(): Buffer {
    throw new Error("TODO: root");
  }

  // TODO: the sibling hashes from leaf `index` up to the root.
  getProof(_index: number): Buffer[] {
    throw new Error("TODO: getProof");
  }
}
