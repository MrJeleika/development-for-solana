# 02 — RDDK Staking

Users stake **RDDK** tokens to earn
**vRDDK**, but they must wait 3 days. vRDDK is the receipt you later burn to get
your RDDK back.

Unlike `01-donor-vault`, this module ships as a **starter**:
the design is yours to figure out.

## What you're given

- `src/lib.rs` — the program's four instructions.
- `src/constants.rs` — the lock duration.
- `tests/02-staking/fixture.ts` + `staking.test.ts` — one happy-path test that
  stakes a single token. It leans on the stubs you fill in, so it won't run
  until you do.

## What you implement

- The program: the account layouts, the errors, and the instruction logic.
- `tests/02-staking/init-vrddk.ts` — creating the vRDDK mint on the client.
- The PDA derivations left as `TODO` in `staking.test.ts`.
- The rest of the tests (claim, unstake, multiple stakes, failure cases).

## Flow

1. **Stake** — deposit RDDK. You can stake multiple times; each stake has its
   own timer.
2. **Claim** — once 3 days have passed for a stake, receive your vRDDK.
3. **Unstake** — burn vRDDK to get the matching RDDK back.

## Run it

```bash
npm run test:staking
```
