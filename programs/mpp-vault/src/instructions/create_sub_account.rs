use anchor_lang::prelude::*;
use crate::state::{Vault, SubAccount, SubAccountStatus};
use crate::errors::VaultError;

#[derive(Accounts)]
#[instruction(name: String, agent_id: String)]
pub struct CreateSubAccount<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ VaultError::Unauthorized,
        seeds = [b"vault", authority.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        init,
        payer = authority,
        space = 8 + SubAccount::INIT_SPACE,
        seeds = [
            b"sub_account",
            vault.key().as_ref(),
            &vault.sub_account_count.to_le_bytes(),
        ],
        bump,
    )]
    pub sub_account: Account<'info, SubAccount>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateSubAccount>,
    name: String,
    agent_id: String,
    total_budget: u64,
) -> Result<()> {
    require!(name.len() <= 32, VaultError::SubAccountNameTooLong);

    let vault = &mut ctx.accounts.vault;
    let sub = &mut ctx.accounts.sub_account;

    sub.vault = vault.key();
    sub.name = name;
    sub.agent_id = agent_id;
    sub.balance = 0;
    sub.total_budget = total_budget;
    sub.spent = 0;
    sub.status = SubAccountStatus::Active;
    sub.max_per_tx = u64::MAX;
    sub.max_per_day = u64::MAX;
    sub.spent_today = 0;
    sub.last_day_reset = 0;
    sub.time_window_start = 0;
    sub.time_window_end = 86400;
    sub.time_window_enabled = false;
    sub.auto_topup_enabled = false;
    sub.auto_topup_min = 0;
    sub.auto_topup_target = 0;
    sub.tx_count = 0;
    sub.bump = ctx.bumps.sub_account;

    vault.sub_account_count += 1;

    Ok(())
}
