use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub authority: Pubkey,
    #[max_len(32)]
    pub name: String,
    pub total_deposited: u64,
    pub total_withdrawn: u64,
    pub sub_account_count: u32,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct SubAccount {
    pub vault: Pubkey,
    #[max_len(32)]
    pub name: String,
    #[max_len(64)]
    pub agent_id: String,
    pub balance: u64,
    pub total_budget: u64,
    pub spent: u64,
    pub status: SubAccountStatus,
    pub max_per_tx: u64,
    pub max_per_day: u64,
    pub spent_today: u64,
    pub last_day_reset: i64,
    pub time_window_start: u32,
    pub time_window_end: u32,
    pub time_window_enabled: bool,
    pub auto_topup_enabled: bool,
    pub auto_topup_min: u64,
    pub auto_topup_target: u64,
    pub tx_count: u64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum SubAccountStatus {
    Active,
    Paused,
    Closed,
}

#[account]
#[derive(InitSpace)]
pub struct WhitelistEntry {
    pub sub_account: Pubkey,
    pub address: Pubkey,
    #[max_len(32)]
    pub label: String,
    pub bump: u8,
}
