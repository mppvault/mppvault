use anchor_lang::prelude::*;
use crate::state::{Vault, SubAccount, SubAccountStatus};
use crate::errors::VaultError;

#[derive(Accounts)]
pub struct PauseSubAccount<'info> {
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
        constraint = sub_account.status == SubAccountStatus::Active @ VaultError::SubAccountNotActive,
    )]
    pub sub_account: Account<'info, SubAccount>,
}

pub fn handler(ctx: Context<PauseSubAccount>) -> Result<()> {
    ctx.accounts.sub_account.status = SubAccountStatus::Paused;
    Ok(())
}
