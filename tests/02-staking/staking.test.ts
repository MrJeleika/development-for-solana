import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";

import { sendIxs, oneToken } from "../helpers";
import { setupStaking, StakingFixture } from "./fixture";

describe("02-staking", () => {
  let env: StakingFixture;

  // TODO(you): derive the user_state PDA.
  const userState = (_user: PublicKey): PublicKey => {
    throw new Error("TODO: derive the user_state PDA");
  };

  // TODO(you): derive the stake_position PDA
  const stakePosition = (_user: PublicKey, _index: number): PublicKey => {
    throw new Error("TODO: derive the stake_position PDA");
  };

  before(async () => {
    env = await setupStaking();
  });

  it("stakes one token into a new position", async () => {
    const { context, program, payer, rddkMint, userRddkAta } = env;
    const position = stakePosition(payer.publicKey, 0);

    const stakeIx = await program.methods
      .stake(oneToken())
      .accountsPartial({
        stakePosition: position,
        userRddkAta,
        rddkMint,
        user: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
    await sendIxs(context, [payer], stakeIx);

    const pos = await program.account.stakePosition.fetch(position);
    assert.equal(pos.amount.toString(), oneToken().toString());
    assert.isAbove(pos.stakedAt.toNumber(), 0);

    const user = await program.account.userState.fetch(
      userState(payer.publicKey),
    );
    assert.equal(user.stakeCount.toNumber(), 1);
  });
});
