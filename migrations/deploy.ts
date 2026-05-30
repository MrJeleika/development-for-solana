// Anchor deploy script. Runs with `anchor migrate` against the configured
// provider. Add per-program initialization here as you build out the modules.
import * as anchor from "@coral-xyz/anchor";

module.exports = async function (provider: anchor.AnchorProvider) {
  anchor.setProvider(provider);
  // Example: const program = anchor.workspace.Token; await program.methods...
};
