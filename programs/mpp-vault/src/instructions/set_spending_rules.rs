use anchor_lang::prelude::*;
use crate::state::{Vault, SubAccount};
use crate::errors::VaultError;

#[derive(Accounts)]
pub struct SetSpendingRules<'info> {
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
    ctx: Context<SetSpendingRules>,
    max_per_tx: u64,
    max_per_day: u64,
) -> Result<()> {
    let sub = &mut ctx.accounts.sub_account;
    sub.max_per_tx = max_per_tx;
    sub.max_per_day = max_per_day;
    Ok(())
}
