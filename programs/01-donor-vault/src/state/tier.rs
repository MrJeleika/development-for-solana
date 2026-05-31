use anchor_lang::prelude::*;

// Tier boundaries, in lamports — the Solana analogue of the task's ETH amounts
// (1 SOL ↔ 1 ether, so 1 SOL = 1_000_000_000 lamports). Kept next to the
// classification logic that is their only user.
const TENTH_SOL: u64 = 100_000_000; // 0.1 SOL
const ONE_SOL: u64 = 1_000_000_000; // 1 SOL
const TEN_SOL: u64 = 10_000_000_000; // 10 SOL

/// Loyalty tier of a donor. Order is fixed and must not change
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum Tier {
    None,
    Bronze,
    Silver,
    Gold,
    Platinum,
}

impl Tier {
    /// Classify a cumulative total using strict boundaries:
    /// `0` → None, `(0, 0.1)` → Bronze, `[0.1, 1)` → Silver, `[1, 10)` → Gold,
    /// `[10, ∞)` → Platinum (amounts in SOL).
    pub fn from_total(total: u64) -> Self {
        if total == 0 {
            Tier::None
        } else if total < TENTH_SOL {
            Tier::Bronze
        } else if total < ONE_SOL {
            Tier::Silver
        } else if total <= TEN_SOL {
            Tier::Gold
        } else {
            Tier::Platinum
        }
    }
}
