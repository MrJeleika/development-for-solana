import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, AccountLayout } from "@solana/spl-token";
import { assert } from "chai";

import { sendIxs, expectReverted, numToHex } from "../helpers";
import {
  setupRaffle,
  deposit,
  fulfillRandomness,
  Entrant,
  RaffleFixture,
} from "./fixture";

describe("05-raffle", () => {
  let env: RaffleFixture;

  // Deposit everyone, run the mocked draw, and return the winning entrant.
  const runDraw = async (): Promise<Entrant> => {
    const { program, raffle, entrants } = env;
    for (const entrant of entrants) {
      await deposit(env, entrant);
    }

    const value = Array.from({ length: 32 }, (_, i) => (i * 7 + 1) & 0xff);
    await fulfillRandomness(env, value);

    const acc = await program.account.raffle.fetch(raffle);
    const total = BigInt(acc.totalWeight.toString());
    const ticket = Buffer.from(value.slice(0, 8)).readBigUInt64LE(0) % total;

    let cumulative = 0n;
    let winner: PublicKey | undefined;
    for (const entry of acc.entries) {
      const weight = BigInt(entry.weight.toString());
      if (ticket >= cumulative && ticket < cumulative + weight) {
        winner = entry.depositor;
        break;
      }
      cumulative += weight;
    }
    const found = entrants.find((e) => e.keypair.publicKey.equals(winner!));
    assert.ok(found, "ticket fell outside every entry");
    return found!;
  };

  beforeEach(async () => {
    env = await setupRaffle();
  });

  it("draws a weighted winner who takes the whole pot", async () => {
    const { context, program, raffle, vault, randomness, entrants } = env;

    const winner = await runDraw();
    const pot = entrants.reduce((sum, e) => sum.add(e.weight), new BN(0));

    const ix = await program.methods
      .claim()
      .accountsPartial({
        raffle,
        vault,
        randomness,
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

    const winner = await runDraw();
    const loser = entrants.find(
      (e) => !e.keypair.publicKey.equals(winner.keypair.publicKey),
    )!;

    const ix = await program.methods
      .claim()
      .accountsPartial({
        raffle,
        vault,
        randomness,
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
