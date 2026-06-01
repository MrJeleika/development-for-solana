import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, AccountLayout } from "@solana/spl-token";
import { assert } from "chai";

import { sendIxs, findPDA, toBN } from "../helpers";
import { setupRaffle, deposit, fulfillRandomness, RaffleFixture } from "./fixture";

describe("05-raffle", () => {
  let env: RaffleFixture;

  const entryPda = (index: number): PublicKey =>
    findPDA(["entry", toBN(index).toArrayLike(Buffer, "le", 8)], env.program)[0];

  before(async () => {
    env = await setupRaffle();
  });

  it("draws a weighted winner who takes the whole pot", async () => {
    const { context, program, raffle, vault, entrants } = env;

    for (let i = 0; i < entrants.length; i++) {
      await deposit(env, entrants[i], entryPda(i));
    }
    const pot = entrants.reduce((sum, e) => sum.add(e.weight), new BN(0));

    // The oracle's callback is mocked for us — this is the random draw.
    const value = Array.from({ length: 32 }, (_, i) => (i * 7 + 1) & 0xff);
    await fulfillRandomness(env, value);

    // Reproduce the program's ticket math, then find whose range contains it.
    const totalWeight = BigInt(
      (await program.account.raffle.fetch(raffle)).totalWeight.toString(),
    );
    const drawn = Buffer.from(value.slice(0, 8)).readBigUInt64LE(0);
    const ticket = drawn % totalWeight;

    let winnerIndex = -1;
    for (let i = 0; i < entrants.length; i++) {
      const e = await program.account.entry.fetch(entryPda(i));
      const start = BigInt(e.rangeStart.toString());
      const end = BigInt(e.rangeEnd.toString());
      if (ticket >= start && ticket < end) {
        winnerIndex = i;
        break;
      }
    }
    assert.isAtLeast(winnerIndex, 0, "ticket fell outside every range");
    const winner = entrants[winnerIndex];

    const claimIx = await program.methods
      .claim(new BN(winnerIndex))
      .accountsPartial({
        raffle,
        vault,
        randomness: env.randomness,
        entry: entryPda(winnerIndex),
        winnerAta: winner.ata,
        winner: winner.keypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
    await sendIxs(context, [winner.keypair], claimIx);

    const acc = await context.banksClient.getAccount(winner.ata);
    const balance = AccountLayout.decode(acc!.data).amount;
    assert.equal(balance.toString(), pot.toString());
  });
});
