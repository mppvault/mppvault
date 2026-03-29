use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("Amount exceeds per-transaction limit")]
    ExceedsPerTxLimit,

    #[msg("Amount exceeds daily spending limit")]
    ExceedsDailyLimit,

    #[msg("Sub-account is not active")]
    SubAccountNotActive,

    #[msg("Sub-account has insufficient balance")]
    InsufficientBalance,

    #[msg("Recipient is not whitelisted")]
    NotWhitelisted,

    #[msg("Current time is outside the allowed time window")]
    OutsideTimeWindow,

    #[msg("Unauthorized: caller is not the vault authority")]
    Unauthorized,

    #[msg("Invalid time window configuration")]
    InvalidTimeWindow,

    #[msg("Vault name too long (max 32 bytes)")]
    NameTooLong,

    #[msg("Sub-account name too long (max 32 bytes)")]
    SubAccountNameTooLong,

    #[msg("Whitelist label too long (max 32 bytes)")]
    LabelTooLong,

    #[msg("Auto top-up target must be greater than minimum")]
    InvalidAutoTopUp,
}
