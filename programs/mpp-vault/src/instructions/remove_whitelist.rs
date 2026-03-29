use anchor_lang::prelude::*;
use crate::state::{Vault, SubAccount, WhitelistEntry};
use crate::errors::VaultError;

#[derive(Accounts)]
pub struct RemoveWhitelist<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        has_one = authority @ VaultError::Unauthorized,
        seeds = [b"vault", authority.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        constraint = sub_account.vault == vault.key(),
    )]
    pub sub_account: Account<'info, SubAccount>,

    #[account(
        mut,
        close = authority,
        constraint = whitelist_entry.sub_account == sub_account.key(),
    )]
    pub whitelist_entry: Account<'info, WhitelistEntry>,
}

pub fn handler(_ctx: Context<RemoveWhitelist>) -> Result<()> {
    Ok(())
}
