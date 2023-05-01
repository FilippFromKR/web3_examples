import fetch from 'node-fetch'
import {convert_time, Time} from "../utils/time";

type Randomness = {

    round: number;
    randomness: string;
    signature: string;
    previous_signature: string;
};


class Drand {
    drand_url: string
    drand_genesis: number
    drand_chain_hash: string
    drand_period: number

    constructor(drand_url: string, drand_genesis: number, drand_chain_hash: string, drand_period: number) {
        this.drand_url = drand_url;
        this.drand_genesis = drand_genesis;
        this.drand_chain_hash = drand_chain_hash;
        this.drand_period = drand_period;
    }

    public async getLatest(): Promise<Randomness> {
        return this.getRandomness()
    }

    public async getByRound(round: number): Promise<Randomness> {
        return this.getRandomness(round)
    }

    private async getRandomness(round?: number): Promise<Randomness> {

        let request_round = round ? round.toString() : "latest";
        let url_suffix = `${this.drand_chain_hash}/public/${request_round}`

        return await this.send_request<Randomness>(url_suffix);

    }


    private async send_request<T>(url_suffix: string) {

        const response = await fetch(`${this.drand_url}${url_suffix}`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        });

        return await response.json() as T;
    }

    public calculate_future_round(time: Time, amount: number): number {
        let time_in_minutes = convert_time(time, amount, Time.Minute);
        // Reduce milliseconds
        let timestamp = Math.floor(Date.now() / 1000);
        let curr_round = (timestamp - this.drand_genesis) / this.drand_period + 1;

        return Math.floor(curr_round + time_in_minutes * 2);


    }
}

export
{
    Drand,
    Randomness
}