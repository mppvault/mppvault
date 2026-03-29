use anchor_lang::prelude::*;
use crate::state::{Vault, SubAccount};
use crate::errors::VaultError;

#[derive(Accounts)]
pub struct SetTimeRules<'info> {
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
    ctx: Context<SetTimeRules>,
    start: u32,
    end: u32,
    enabled: bool,
) -> Result<()> {
    require!(start < end || !enabled, VaultError::InvalidTimeWindow);

    let sub = &mut ctx.accounts.sub_account;
    sub.time_window_start = start;
    sub.time_window_end = end;
    sub.time_window_enabled = enabled;
    Ok(())
}
