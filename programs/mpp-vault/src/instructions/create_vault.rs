use anchor_lang::prelude::*;
use crate::state::Vault;
use crate::errors::VaultError;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault", authority.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, Vault>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateVault>, name: String) -> Result<()> {
    require!(name.len() <= 32, VaultError::NameTooLong);

    let vault = &mut ctx.accounts.vault;
    vault.authority = ctx.accounts.authority.key();
    vault.name = name;
    vault.total_deposited = 0;
    vault.total_withdrawn = 0;
    vault.sub_account_count = 0;
    vault.bump = ctx.bumps.vault;

    Ok(())
}
