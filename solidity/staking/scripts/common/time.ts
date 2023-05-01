import {time} from "@nomicfoundation/hardhat-network-helpers";

async function skip_time(time_ty: Time, amount: number) {

    let sec = to_sec(time_ty, amount);

    await time.increase(sec);


}

function to_sec(time: Time, amount: number): number {
    switch (time) {
        case Time.Sec:
            return amount;
        case Time.Minute:
            return amount * 60;
        case Time.Hour:
            return amount * 60 * 60;
        case Time.Day:
            return amount * 24 * 60 * 60;
        case Time.Week:
            return amount * 7 * 24 * 60 * 60;
    }
    ;

}

enum Time {
    Sec,
    Minute,
    Hour,
    Day,
    Week
}

export {
    skip_time,
    Time,
    to_sec
}