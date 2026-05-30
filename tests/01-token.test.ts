import { Program, BN } from "@coral-xyz/anchor";
import { BankrunProvider } from "anchor-bankrun";
import { startAnchor, ProgramTestContext } from "solana-bankrun";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  AccountLayout,
  MintLayout,
} from "@solana/spl-token";
import { assert } from "chai";

import { Token } from "../target/types/token";
import idl from "../target/idl/token.json";

const CONFIG_SEED = Buffer.from("config");
const MINT_SEED = Buffer.from("mint");
const DECIMALS = 6;
const INITIAL_SUPPLY = new BN(1_000_000_000); // 1,000 tokens at 6 decimals

describe("01-token", () => {
  let context: ProgramTestContext;
  let provider: BankrunProvider;
  let program: Program<Token>;
  let payer: Keypair;

  let config: PublicKey;
  let mint: PublicKey;
  let payerAta: PublicKey;

  // Read a token account's `amount` straight from the bank.
  async function tokenBalance(ata: PublicKey): Promise<bigint> {
    const account = await context.banksClient.getAccount(ata);
    if (!account) return 0n;
    return AccountLayout.decode(account.data).amount;
  }

  async function mintSupply(): Promise<bigint> {
    const account = await context.banksClient.getAccount(mint);
    return MintLayout.decode(account!.data).supply;
  }

  before(async () => {
    context = await startAnchor("", [], []);
    provider = new BankrunProvider(context);
    program = new Program<Token>(idl as Token, provider);
    payer = context.payer;

    [config] = PublicKey.findProgramAddressSync([CONFIG_SEED], program.programId);
    [mint] = PublicKey.findProgramAddressSync([MINT_SEED], program.programId);
    payerAta = getAssociatedTokenAddressSync(mint, payer.publicKey);
  });

  it("initializes the mint and credits the initial supply", async () => {
    await program.methods
      .initialize(DECIMALS, INITIAL_SUPPLY)
      .accounts({
        config,
        mint,
        destination: payerAta,
        payer: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const configAccount = await program.account.config.fetch(config);
    assert.isTrue(configAccount.owner.equals(payer.publicKey));
    assert.isTrue(configAccount.mint.equals(mint));

    assert.equal((await tokenBalance(payerAta)).toString(), INITIAL_SUPPLY.toString());
    assert.equal((await mintSupply()).toString(), INITIAL_SUPPLY.toString());
  });

  it("lets the owner mint to a new recipient", async () => {
    const recipient = Keypair.generate();
    const recipientAta = getAssociatedTokenAddressSync(mint, recipient.publicKey);
    const amount = new BN(500);

    await program.methods
      .mintTokens(amount)
      .accounts({
        config,
        mint,
        destination: recipientAta,
        recipient: recipient.publicKey,
        owner: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    assert.equal((await tokenBalance(recipientAta)).toString(), amount.toString());
  });

  it("burns tokens from the caller's account", async () => {
    const before = await tokenBalance(payerAta);
    const amount = new BN(1_000);

    await program.methods
      .burnTokens(amount)
      .accounts({
        config,
        mint,
        from: payerAta,
        owner: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const after = await tokenBalance(payerAta);
    assert.equal((before - after).toString(), amount.toString());
  });

  it("rejects minting from a non-owner", async () => {
    const attacker = Keypair.generate();
    context.setAccount(attacker.publicKey, {
      lamports: 1_000_000_000,
      data: Buffer.alloc(0),
      owner: SystemProgram.programId,
      executable: false,
      rentEpoch: 0,
    });

    const recipientAta = getAssociatedTokenAddressSync(mint, attacker.publicKey);

    try {
      await program.methods
        .mintTokens(new BN(1))
        .accounts({
          config,
          mint,
          destination: recipientAta,
          recipient: attacker.publicKey,
          owner: attacker.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([attacker])
        .rpc();
      assert.fail("expected the non-owner mint to revert");
    } catch (err: any) {
      assert.match(String(err), /Unauthorized|has_one|ConstraintHasOne/i);
    }
  });
});
