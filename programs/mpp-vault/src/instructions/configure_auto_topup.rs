use anchor_lang::prelude::*;
use crate::state::{Vault, SubAccount};
use crate::errors::VaultError;

#[derive(Accounts)]
pub struct ConfigureAutoTopUp<'info> {
    pub authority: Signer<'info>,

    #[account(
        has_one = authority @ VaultError::Unauthorized,
        seeds = [b"vault", authority.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        constraint = sub_account.vault == vault.key(),
    )]
    pub sub_account: Account<'info, SubAccount>,
}

pub fn handler(
    ctx: Context<ConfigureAutoTopUp>,
    enabled: bool,
    min_balance: u64,
    target_balance: u64,
) -> Result<()> {
    if enabled {
        require!(target_balance > min_balance, VaultError::InvalidAutoTopUp);
    }

    let sub = &mut ctx.accounts.sub_account;
    sub.auto_topup_enabled = enabled;
    sub.auto_topup_min = min_balance;
    sub.auto_topup_target = target_balance;
    Ok(())
}
