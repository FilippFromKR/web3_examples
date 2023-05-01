
enum Time {
    Sec = 1,
    Minute = Sec * 60,
    Hour = Minute * 60,
    Day = Hour * 24,
    Week = Day * 7
}

function convert_time(from: Time, amount: number, to: Time): number {
    return (from * amount) / to


}

export
{
    convert_time,
    Time
}
