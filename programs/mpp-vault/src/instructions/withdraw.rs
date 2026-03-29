use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::{Vault, SubAccount};
use crate::errors::VaultError;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
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

    #[account(
        mut,
        constraint = vault_token_account.owner == vault.key(),
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub to_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    require!(
        ctx.accounts.sub_account.balance >= amount,
        VaultError::InsufficientBalance,
    );

    let authority_key = ctx.accounts.authority.key();
    let seeds = &[
        b"vault".as_ref(),
        authority_key.as_ref(),
        &[ctx.accounts.vault.bump],
    ];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.to_token_account.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            &[seeds],
        ),
        amount,
    )?;

    ctx.accounts.sub_account.balance -= amount;
    ctx.accounts.vault.total_withdrawn += amount;

    Ok(())
}
