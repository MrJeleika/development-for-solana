import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, AccountLayout } from "@solana/spl-token";
import { assert } from "chai";

import { sendIxs, findPDA, toBN, expectReverted, numToHex } from "../helpers";
import { setupRaffle, deposit, fulfillRandomness, RaffleFixture } from "./fixture";

describe("05-raffle", () => {
  let env: RaffleFixture;

  const entryPda = (index: number): PublicKey =>
    findPDA(["entry", toBN(index).toArrayLike(Buffer, "le", 8)], env.program)[0];

  // Deposit everyone, run the mocked draw, and return the winning entry index.
  const runDraw = async (): Promise<number> => {
    const { program, raffle, entrants } = env;
    for (let i = 0; i < entrants.length; i++) {
      await deposit(env, entrants[i], entryPda(i));
    }

    const value = Array.from({ length: 32 }, (_, i) => (i * 7 + 1) & 0xff);
    await fulfillRandomness(env, value);

    const totalWeight = BigInt(
      (await program.account.raffle.fetch(raffle)).totalWeight.toString(),
    );
    const ticket = Buffer.from(value.slice(0, 8)).readBigUInt64LE(0) % totalWeight;
    for (let i = 0; i < entrants.length; i++) {
      const e = await program.account.entry.fetch(entryPda(i));
      if (
        ticket >= BigInt(e.rangeStart.toString()) &&
        ticket < BigInt(e.rangeEnd.toString())
      ) {
        return i;
      }
    }
    throw new Error("ticket fell outside every range");
  };

  beforeEach(async () => {
    env = await setupRaffle();
  });

  it("draws a weighted winner who takes the whole pot", async () => {
    const { context, program, raffle, vault, randomness, entrants } = env;

    const winnerIndex = await runDraw();
    const winner = entrants[winnerIndex];
    const pot = entrants.reduce((sum, e) => sum.add(e.weight), new BN(0));

    const ix = await program.methods
      .claim(new BN(winnerIndex))
      .accountsPartial({
        raffle,
        vault,
        randomness,
        entry: entryPda(winnerIndex),
        winnerAta: winner.ata,
        winner: winner.keypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
    await sendIxs(context, [winner.keypair], ix);

    const acc = await context.banksClient.getAccount(winner.ata);
    assert.equal(AccountLayout.decode(acc!.data).amount.toString(), pot.toString());
  });

  it("rejects a claim from a non-winning entry", async () => {
    const { context, program, raffle, vault, randomness, entrants } = env;

    const winnerIndex = await runDraw();
    const loserIndex = winnerIndex === 0 ? 1 : 0;
    const loser = entrants[loserIndex];

    const ix = await program.methods
      .claim(new BN(loserIndex))
      .accountsPartial({
        raffle,
        vault,
        randomness,
        entry: entryPda(loserIndex),
        winnerAta: loser.ata,
        winner: loser.keypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    // NotWinner is the 9th error variant → 6008 → 0x1778.
    await expectReverted(
      { revertedWith: { message: numToHex(6008) } },
      sendIxs(context, [loser.keypair], ix),
    );
  });
});
