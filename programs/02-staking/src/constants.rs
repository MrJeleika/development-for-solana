use anchor_lang::prelude::*;

/// 3 days — a stake must mature this long before its vRDDK can be claimed.
pub const LOCK_DURATION_SECONDS: i64 = 3 * 24 * 60 * 60;

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";

#[constant]
pub const VAULT_SEED: &[u8] = b"vault";

#[constant]
pub const USER_SEED: &[u8] = b"user";

#[constant]
pub const STAKE_SEED: &[u8] = b"stake";
