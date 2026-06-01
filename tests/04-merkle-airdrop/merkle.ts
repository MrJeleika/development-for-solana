import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { createHash } from "crypto";

export interface AirdropEntry {
  account: PublicKey;
  amount: BN;
}

const sha256 = (...parts: Buffer[]): Buffer =>
  createHash("sha256").update(Buffer.concat(parts)).digest();

// Hash one entry into a 32-byte leaf: sha256(account || amount_le_u64). Must
// match what the program recomputes.
export const hashLeaf = (entry: AirdropEntry): Buffer =>
  sha256(entry.account.toBuffer(), entry.amount.toArrayLike(Buffer, "le", 8));

// Hash a pair of nodes, sorted, so a proof doesn't need to encode left/right.
const hashPair = (a: Buffer, b: Buffer): Buffer =>
  Buffer.compare(a, b) <= 0 ? sha256(a, b) : sha256(b, a);

export class MerkleTree {
  private layers: Buffer[][];

  constructor(entries: AirdropEntry[]) {
    let layer = entries.map(hashLeaf);
    this.layers = [layer];
    while (layer.length > 1) {
      const next: Buffer[] = [];
      for (let i = 0; i < layer.length; i += 2) {
        next.push(
          i + 1 < layer.length ? hashPair(layer[i], layer[i + 1]) : layer[i],
        );
      }
      this.layers.push(next);
      layer = next;
    }
  }

  get root(): Buffer {
    return this.layers[this.layers.length - 1][0];
  }

  getProof(index: number): Buffer[] {
    const proof: Buffer[] = [];
    let idx = index;
    for (let l = 0; l < this.layers.length - 1; l++) {
      const layer = this.layers[l];
      const sibling = idx ^ 1;
      if (sibling < layer.length) proof.push(layer[sibling]);
      idx = Math.floor(idx / 2);
    }
    return proof;
  }
}
