use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::{Vault, SubAccount, SubAccountStatus, WhitelistEntry};
use crate::errors::VaultError;

const SECONDS_PER_DAY: i64 = 86_400;

#[derive(Accounts)]
pub struct ExecutePayment<'info> {
    pub agent: Signer<'info>,

    #[account(
        seeds = [b"vault", vault.authority.as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        constraint = sub_account.vault == vault.key(),
        constraint = sub_account.status == SubAccountStatus::Active @ VaultError::SubAccountNotActive,
    )]
    pub sub_account: Account<'info, SubAccount>,

    #[account(
        constraint = whitelist_entry.sub_account == sub_account.key(),
        constraint = whitelist_entry.address == recipient.key() @ VaultError::NotWhitelisted,
    )]
    pub whitelist_entry: Account<'info, WhitelistEntry>,

    #[account(
        mut,
        constraint = vault_token_account.owner == vault.key(),
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    /// CHECK: This is the recipient's token account, validated via whitelist
    pub recipient: AccountInfo<'info>,

    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ExecutePayment>, amount: u64) -> Result<()> {
    let sub = &mut ctx.accounts.sub_account;
    let clock = Clock::get()?;

    require!(sub.balance >= amount, VaultError::InsufficientBalance);
    require!(amount <= sub.max_per_tx, VaultError::ExceedsPerTxLimit);

    if sub.time_window_enabled {
        let seconds_into_day = (clock.unix_timestamp % SECONDS_PER_DAY) as u32;
        require!(
            seconds_into_day >= sub.time_window_start
                && seconds_into_day <= sub.time_window_end,
            VaultError::OutsideTimeWindow,
        );
    }

    let current_day = clock.unix_timestamp / SECONDS_PER_DAY;
    let last_reset_day = sub.last_day_reset / SECONDS_PER_DAY;

    if current_day > last_reset_day {
        sub.spent_today = 0;
        sub.last_day_reset = clock.unix_timestamp;
    }

    require!(
        sub.spent_today + amount <= sub.max_per_day,
        VaultError::ExceedsDailyLimit,
    );

    let authority_key = ctx.accounts.vault.authority;
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
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            &[seeds],
        ),
        amount,
    )?;

    sub.balance -= amount;
    sub.spent += amount;
    sub.spent_today += amount;
    sub.tx_count += 1;

    Ok(())
}
