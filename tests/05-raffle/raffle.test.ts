import { setupRaffle, fulfillRandomness, RaffleFixture } from "./fixture";

describe("05-raffle", () => {
  let env: RaffleFixture;

  before(async () => {
    env = await setupRaffle();
  });

  it("draws a weighted winner who takes the whole pot", async () => {
    // TODO(you): initialize the raffle, recording `env.oracle` as the trusted
    //            oracle, then have a few of `env.funded` accounts deposit
    //            different amounts of `env.mint`.

    // The oracle's callback is mocked for you — this is the random draw. Swap in
    // whatever 32 bytes you like:
    await fulfillRandomness(env, Array.from({ length: 32 }, (_, i) => i));

    // TODO(you): read the delivered randomness, work out the winning entry,
    //            claim with it, and assert the winner received the whole pot.
  });
});
