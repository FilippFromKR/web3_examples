// SPDX-License-Identifier: Apache-2.0

/// Smart contract for the draw of unique objects with Drand randomness.
/// More information about Drand in (sources/drand.move).
/// User create Lottery Campaign for his object,
/// by providing ticket price and deadline as Drand round.
/// Tickets will be sold, untill somebody close the campaign,
/// by providing drand signatures of round (drand_round - 2).
/// When campaign will be closed, the winner can be derived by everyone,
/// who will call the function with signatures of final round.
module lottery::lottery
{
    use std::option::{Self, Option};
    use std::vector;

    use lottery::drand::{Self, derive_randomness, safe_selection};
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::event::emit;
    use sui::object::{Self, UID, ID};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};


    /*----Errors----*/
    const ECAMPAIGN_FINISHED: u64 = 0;
    const ECAMPAIGN_NOT_FINISHED: u64 = 1;
    const ECAMPAIGN_NOT_IN_PROGRESS: u64 = 2;
    const ECAMPAIGN_NOT_CLOSED: u64 = 3;
    const ENOT_ENOUGH_TICKETS: u64 = 4;
    const ENOT_ENOUGH_MONEY: u64 = 5;
    const EWRONG_CAMPAIGN: u64 = 6;
    const ENOT_THE_WINNER: u64 = 7;

    /*----Campaign Status----*/
    const IN_PROGRESS: u8 = 0;
    const CLOSED: u8 = 1;
    const FINISHED: u8 = 2;
    const SOLD_OUT: u8 = 3;

    const ROUNDS_BEFORE_FINISH_TO_CLOSE_CAMPAIGN: u64 = 2;

    /*----Events----*/
    struct NewCampaign has drop, copy
    {
        campaign_id: ID,
        prize_id: ID,
        ticket_cost: u64,
        deadline: u64,
    }

    struct CampaignClosed has drop, copy
    {
        id: ID,
    }

    struct CampaignWinner has drop, copy
    {
        campaign_id: ID,
        victorious_ticket_number: u64
    }

    struct PrizeClaimed has drop, copy
    {
        campaign_id: ID,
        prize_id: ID
    }


    struct SoldOut has drop, copy
    {
        campaign_id: ID,
    }

    /*----objects---- */
    struct LotteryCampaign<T: store + key> has store, key
    {
        id: UID,
        state: u8,
        max_tickets: u64,
        tickets_sold: u64,
        ticket_price: u64,
        drand_round: u64,
        balance: Balance<SUI>,
        prize: Option<T>,
        winner: Option<u64>
    }

    struct Ticket has store, key {
        id: UID,
        campaign_id: ID,
        indexes: vector<u64>,
    }

    struct Admin has key
    {
        id: UID,
        campaign_id: ID,
    }

    struct Event has drop, copy
    {
        round: vector<u8>,
    }

    entry fun init(_ctx: &mut TxContext) {}


    /*----Entry----*/

    /// Create lottery campaign.
    public entry fun create_campaign<T: store + key>(
        max_tickets: u64,
        ticket_price: u64,
        drand_round: u64,
        prize: T,
        ctx: &mut TxContext
    )
    {
        let lottery_campaign = LotteryCampaign<T>
            {
                id: object::new(ctx),
                state: IN_PROGRESS,
                max_tickets,
                tickets_sold: 0,
                ticket_price,
                drand_round,
                balance: balance::zero(),
                prize: option::some(prize),
                winner: option::none()
            };

        emit(
            NewCampaign
                {
                    campaign_id: object::id(&lottery_campaign),
                    prize_id: object::id(option::borrow(&lottery_campaign.prize)),
                    ticket_cost: lottery_campaign.ticket_price,
                    deadline: lottery_campaign.drand_round
                }
        );
        let admin = Admin
            {
                id: object::new(ctx),
                campaign_id: object::id(&lottery_campaign),
            };

        transfer::transfer(admin, tx_context::sender(ctx));

        transfer::share_object(lottery_campaign);
    }


    /// Buy function for users who has already had the ticket.
    entry fun buy_with_ticket<T: store + key>(
        game: &mut LotteryCampaign<T>,
        ticket: &mut Ticket,
        tickets_to_buy: u64,
        payment: &mut Coin<SUI>,
    )
    {
        is_available_to_buy(game, tickets_to_buy, payment);
        is_currant_game(game, ticket.campaign_id);

        let current_amount_of_tickets = game.tickets_sold;
        let new_tickets_amount = tickets_to_buy + game.tickets_sold;

        fill_ticket_indexes(current_amount_of_tickets, new_tickets_amount, ticket);

        game.tickets_sold = new_tickets_amount;

        let coin_balance = coin::balance_mut(payment);
        let paid = balance::split(coin_balance, game.ticket_price * tickets_to_buy);


        balance::join(&mut game.balance, paid);

        sold_out(game);
    }

    /// Buy function for users who participate first time in current campaign
    entry fun buy_without_ticket<T: store + key>(
        game: &mut LotteryCampaign<T>,
        tickets_to_buy: u64,
        payment: &mut Coin<SUI>,
        ctx: &mut TxContext
    )
    {
        is_available_to_buy(game, tickets_to_buy, payment);


        let current_amount_of_tickets = game.tickets_sold;
        let new_tickets_amount = tickets_to_buy + game.tickets_sold;

        let new_ticket = Ticket
            {
                id: object::new(ctx),
                campaign_id: object::id(game),
                indexes: vector::empty()
            };
        fill_ticket_indexes(current_amount_of_tickets, new_tickets_amount, &mut new_ticket);

        transfer::transfer(new_ticket, tx_context::sender(ctx));

        game.tickets_sold = new_tickets_amount;

        let coin_balance = coin::balance_mut(payment);
        let paid = balance::split(coin_balance, game.ticket_price * tickets_to_buy);


        balance::join(&mut game.balance, paid);

        sold_out(game);
    }

    /// Update state if sold out
    entry fun sold_out<T: store + key>(game: &mut LotteryCampaign<T>)
    {
        if (game.tickets_sold == game.max_tickets)
        {
            game.state = SOLD_OUT;
            emit(
                SoldOut
                    {
                        campaign_id: object::uid_to_inner(&game.id)
                    }
            )
        }
    }

    /// Close campaign with drand signatures
    entry fun close_campaign<T: store + key>(
        game: &mut LotteryCampaign<T>,
        drand_sig:
        vector<u8>,
        drand_prev_sig:
        vector<u8>)
    {
        is_not_finished(game);
        drand::verify_drand_signature(drand_sig, drand_prev_sig, game.drand_round - ROUNDS_BEFORE_FINISH_TO_CLOSE_CAMPAIGN);
        game.state = CLOSED;
        emit(
            CampaignClosed
                {
                    id: object::uid_to_inner(&game.id)
                }
        )
    }

    /// Derive winner by Drand randomness from final round signatures.
    entry fun get_winner<T: store + key>(
        game: &mut LotteryCampaign<T>,
        drand_sig:
        vector<u8>,
        drand_prev_sig:
        vector<u8>
    )
    {
        assert!(game.state == CLOSED, ECAMPAIGN_NOT_CLOSED);
        drand::verify_drand_signature(drand_sig, drand_prev_sig, game.drand_round);

        game.state = FINISHED;
        let digest = derive_randomness(drand_sig);
        let winner = safe_selection(game.tickets_sold, digest);

        if (winner == 0)
            winner = 1;

        game.winner = option::some(winner);

        emit(
            CampaignWinner
                {
                    campaign_id: object::id(game),
                    victorious_ticket_number: *option::borrow(&game.winner)
                }
        )
    }


    /// Winner can take his prize.
    entry fun
    claim_reward<T:
    store + key>(game: &mut LotteryCampaign<T>,
                 ticket:
                 Ticket,
                 ctx: &mut TxContext
    )
    {
        assert!(game.state == FINISHED, ECAMPAIGN_NOT_FINISHED);
        is_currant_game(game, ticket.campaign_id);


        let Ticket
        {
            id: ticket_id,
            campaign_id: _,
            indexes,
        } = ticket;

        let is_winner = vector::contains(&indexes, option::borrow(&game.winner));
        assert!(is_winner, ENOT_THE_WINNER);

        emit(
            PrizeClaimed {
                campaign_id: object::uid_to_inner(&game.id),
                prize_id: object::id(option::borrow(&game.prize)),
            }
        );


        transfer::transfer(option::extract(&mut game.prize), tx_context::sender(ctx));


        object::delete(ticket_id);
    }

    /// Delete ticket
    entry fun
    delete_ticket(ticket: Ticket)
    {
        let Ticket
        {
            id: ticket_id,
            campaign_id: _,
            indexes: _,
        } = ticket;

        object::delete(ticket_id);
    }

    /// Lottery campaign creator can take his Coins, for sold tickets
    entry fun consume_balance<T: store + key>(admin: &Admin, campaign: &mut LotteryCampaign<T>, ctx: &mut TxContext)
    {
        is_currant_game(campaign, admin.campaign_id);

        let amount = balance::value(&campaign.balance);
        let profits = coin::take(&mut campaign.balance, amount, ctx);

        transfer::transfer(profits, tx_context::sender(ctx));
    }

    /*---Helpers----*/
    fun fill_ticket_indexes(current_tickets_amount: u64, new_tickets_amount: u64, ticket: &mut Ticket)
    {
        while (current_tickets_amount != new_tickets_amount)
            {
                current_tickets_amount = current_tickets_amount + 1;
                vector::push_back(&mut ticket.indexes, current_tickets_amount);
            };
    }


    /*----Asserts----*/

    fun is_not_finished<T: store + key>(game: &mut LotteryCampaign<T>)
    {
        assert!(game.state != FINISHED, ECAMPAIGN_FINISHED);
    }


    fun is_available_to_buy<T: store + key>(game: &mut LotteryCampaign<T>, tickets_to_buy: u64, coin: &Coin<SUI>)
    {
        assert!(game.state == IN_PROGRESS, ECAMPAIGN_NOT_IN_PROGRESS);
        is_enough_tickets(game, tickets_to_buy);
        is_enough_money(game, tickets_to_buy, coin)
    }


    fun is_enough_tickets<T: store + key>(game: &mut LotteryCampaign<T>, tickets_to_buy: u64)
    {
        assert!(game.tickets_sold + tickets_to_buy <= game.max_tickets, ENOT_ENOUGH_TICKETS);
    }

    fun is_enough_money<T: store + key>(game: &mut LotteryCampaign<T>, tickets_to_buy: u64, coin: &Coin<SUI>)
    {
        assert!(coin::value(coin) >= game.ticket_price * tickets_to_buy, ENOT_ENOUGH_MONEY);
    }

    fun is_currant_game<T: store + key>(game: &LotteryCampaign<T>, id: ID)
    {
        assert!(object::id(game) == id, EWRONG_CAMPAIGN);
    }

    /*----Get----*/
    public fun ticket_campaign_id(ticket: &Ticket): ID
    {
        ticket.campaign_id
    }
    public fun ticket_indexes(ticket: &Ticket): vector<u64>
    {
        ticket.indexes
    }
}