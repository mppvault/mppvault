use anchor_lang::prelude::*;
use crate::state::{Vault, SubAccount, WhitelistEntry};
use crate::errors::VaultError;

#[derive(Accounts)]
#[instruction(address: Pubkey, label: String)]
pub struct AddWhitelist<'info> {
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
        init,
        payer = authority,
        space = 8 + WhitelistEntry::INIT_SPACE,
        seeds = [
            b"whitelist",
            sub_account.key().as_ref(),
            address.as_ref(),
        ],
        bump,
    )]
    pub whitelist_entry: Account<'info, WhitelistEntry>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<AddWhitelist>,
    address: Pubkey,
    label: String,
) -> Result<()> {
    require!(label.len() <= 32, VaultError::LabelTooLong);

    let entry = &mut ctx.accounts.whitelist_entry;
    entry.sub_account = ctx.accounts.sub_account.key();
    entry.address = address;
    entry.label = label;
    entry.bump = ctx.bumps.whitelist_entry;
    Ok(())
}
