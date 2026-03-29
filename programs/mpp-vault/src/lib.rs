use anchor_lang::prelude::*;

mod errors;
mod instructions;
mod state;

use instructions::*;

declare_id!("2WBK34gnJjYRN4J8fB97CTwRqPJYpx8XsdhDSb1fpPBx");

#[program]
pub mod mpp_vault {
    use super::*;

    pub fn create_vault(ctx: Context<CreateVault>, name: String) -> Result<()> {
        instructions::create_vault::handler(ctx, name)
    }

    pub fn create_sub_account(
        ctx: Context<CreateSubAccount>,
        name: String,
        agent_id: String,
        total_budget: u64,
    ) -> Result<()> {
        instructions::create_sub_account::handler(ctx, name, agent_id, total_budget)
    }

    pub fn set_spending_rules(
        ctx: Context<SetSpendingRules>,
        max_per_tx: u64,
        max_per_day: u64,
    ) -> Result<()> {
        instructions::set_spending_rules::handler(ctx, max_per_tx, max_per_day)
    }

    pub fn set_time_rules(
        ctx: Context<SetTimeRules>,
        start: u32,
        end: u32,
        enabled: bool,
    ) -> Result<()> {
        instructions::set_time_rules::handler(ctx, start, end, enabled)
    }

    pub fn configure_auto_topup(
        ctx: Context<ConfigureAutoTopUp>,
        enabled: bool,
        min_balance: u64,
        target_balance: u64,
    ) -> Result<()> {
        instructions::configure_auto_topup::handler(ctx, enabled, min_balance, target_balance)
    }

    pub fn add_whitelist(
        ctx: Context<AddWhitelist>,
        address: Pubkey,
        label: String,
    ) -> Result<()> {
        instructions::add_whitelist::handler(ctx, address, label)
    }

    pub fn remove_whitelist(ctx: Context<RemoveWhitelist>) -> Result<()> {
        instructions::remove_whitelist::handler(ctx)
    }

    pub fn pause_sub_account(ctx: Context<PauseSubAccount>) -> Result<()> {
        instructions::pause_sub_account::handler(ctx)
    }

    pub fn resume_sub_account(ctx: Context<ResumeSubAccount>) -> Result<()> {
        instructions::resume_sub_account::handler(ctx)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handler(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        instructions::withdraw::handler(ctx, amount)
    }

    pub fn execute_payment(ctx: Context<ExecutePayment>, amount: u64) -> Result<()> {
        instructions::execute_payment::handler(ctx, amount)
    }
}
