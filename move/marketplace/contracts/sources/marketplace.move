// Copyright 2022 ComingChat Authors. Licensed under Apache-2.0 License.

/// Smart contract for the trading of unique objects, with a 2.5% fee for trade.
/// User can sale the object, by providing it and a specific object price.
/// Also, the user can take the object back, if the item have not sold.
/// Buyer pay the 2.5% fee.
module marketplace::marketplace {
    use std::ascii::String;
    use std::type_name::{into_string, get};

    use sui::balance::{Self, Balance, zero};
    use sui::coin::{Self, Coin};
    use sui::event::emit;
    use sui::object::{Self, UID, ID};
    use sui::object_table::{Self, ObjectTable};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    // 2.5% = 250/10000
    const FEE_POINT: u8 = 250;

    // For when someone tries to delist without ownership.
    const ERR_NOT_OWNER: u64 = 1;
    // For when amount paid does not match the expected.
    const ERR_AMOUNT_INCORRECT: u64 = 2;

    /*----objects----*/

    struct MarketManagerCap has key, store {
        id: UID
    }

    struct ObjectMarket<T: key + store, phantom C> has key {
        id: UID,
        next_index: u64,
        fee: Balance<C>,
        items: ObjectTable<u64, Listing<T, C>>
    }

    struct Listing<T: key + store, phantom C> has key, store {
        id: UID,
        item: T,
        price: u64,
        owner: address,
    }

    /*----events----*/

    struct MarketCreated<phantom T, phantom C> has copy, drop {
        market_id: ID,
        object: String,
        coin: String
    }

    struct ItemListed<phantom C> has copy, drop {
        index: u64,
        item_id: ID,
        coin: String,
        price: u64,
        owner: address,
    }

    struct ItemDelisted<phantom C> has copy, drop {
        index: u64,
        item_id: ID,
        coin: String,
    }

    struct ItemPurchased<phantom C> has copy, drop {
        index: u64,
        item_id: ID,
        new_owner: address,
        coin: String,
    }

   /*----publishing ----*/

    // Publishing smart contract and sending Manager object to the publisher
    fun init(ctx: &mut TxContext) {
        transfer::transfer(
            MarketManagerCap {
                id: object::new(ctx)
            },
            tx_context::sender(ctx)
        )
    }


    // Creating market, allowed only for MarketManagerCap holders.
    public entry fun create_market<T: key + store, C>(
        _: &MarketManagerCap,
        ctx: &mut TxContext
    ) {
        let id = object::new(ctx);
        emit(MarketCreated<T, C> {
            market_id: object::uid_to_inner(&id),
            object: into_string(get<T>()),
            coin: into_string(get<C>())
        });
        transfer::share_object(
            ObjectMarket<T, C> {
                id,
                next_index: 0,
                fee: zero<C>(),
                items: object_table::new<u64, Listing<T, C>>(ctx)
            }
        );
    }

    /*----actions----*/

    // Put up for sale the object with a specific price.
    public entry fun list<T: key + store, C>(
        market: &mut ObjectMarket<T, C>,
        item: T,
        price: u64,
        ctx: &mut TxContext
    ) {
        let id = object::new(ctx);
        let item_id = object::id(&item);
        let owner = tx_context::sender(ctx);

        emit(ItemListed<C> {
            index: market.next_index,
            item_id: *&item_id,
            coin: into_string(get<C>()),
            price,
            owner
        });

        object_table::add(
            &mut market.items,
            market.next_index,
            Listing<T, C> { id, item, price, owner }
        );

        market.next_index = market.next_index + 1;
    }

    // Take the object back from marketplace.
     entry fun delist<T: key + store, C>(
        market: &mut ObjectMarket<T, C>,
        item_index: u64,
        ctx: &mut TxContext
    ) {
        let Listing { id, item, price: _, owner } = object_table::remove<u64, Listing<T, C>>(
            &mut market.items,
            item_index
        );

        assert!(tx_context::sender(ctx) == owner, ERR_NOT_OWNER);

        emit(ItemDelisted<C> {
            index: item_index,
            item_id: object::id(&item),
            coin: into_string(get<C>()),
        });

        object::delete(id);

        transfer::transfer(
            item,
            tx_context::sender(ctx)
        )
    }



    // Buy and take the object.
    entry fun purchase_and_take<T: key + store, C>(
        market: &mut ObjectMarket<T, C>,
        item_index: u64,
        paid: Coin<C>,
        ctx: &mut TxContext
    ) {
        let Listing { id, item, price, owner } = object_table::remove<u64, Listing<T, C>>(
            &mut market.items,
            item_index
        );
        let new_owner = tx_context::sender(ctx);

        assert!(price == coin::value(&paid), ERR_AMOUNT_INCORRECT);

        emit(ItemPurchased<C> {
            index: item_index,
            item_id: object::id(&item),
            coin: into_string(get<C>()),
            new_owner
        });

        // handle 2.5% fee
        let fee = coin::value(&paid) / 10000 * (FEE_POINT as u64);
        if (fee > 0) {
            let fee_balance = coin::into_balance(coin::split(&mut paid, fee, ctx));
            balance::join(&mut market.fee, fee_balance);
        };

        transfer::transfer(paid, owner);

        object::delete(id);

        transfer::transfer(
            item,
            tx_context::sender(ctx)
        )
    }


    // Withdraw the fee money from the market balance.
    // Only for MarketManagerCap holders
    public entry fun withdraw<T: key + store, C>(
        _: &MarketManagerCap,
        market: &mut ObjectMarket<T, C>,
        ctx: &mut TxContext
    ) {


        let fee = balance::value(&market.fee);
        let fee_balance = balance::split<C>(&mut market.fee, fee);

        transfer::transfer(
            coin::from_balance(fee_balance, ctx),
            tx_context::sender(ctx)
        )
    }
}