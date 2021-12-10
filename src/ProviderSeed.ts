import {
    AuthEvents,
    Handler,
    ConnectOptions,
    UserData,
    TypedData,
    Provider,
    SignerTx,
    SignedTx,
} from '@waves/signer';
import { EventEmitter } from 'typed-ts-events';
import { libs, signTx, TTxParams, WithTxType } from '@waves/waves-transactions';

export class ProviderSeed implements Provider {
    public user: UserData | null = null;
    private readonly _seed: string;
    private readonly _emitter: EventEmitter<AuthEvents> =
        new EventEmitter<AuthEvents>();
    private _options: ConnectOptions = {
        NETWORK_BYTE: 'W'.charCodeAt(0),
        NODE_URL: 'https://nodes.wavesplatform.com',
    };

    constructor(seed?: string) {
        this._seed = seed || libs.crypto.randomSeed();
    }

    on<EVENT extends keyof AuthEvents>(
        event: EVENT,
        handler: Handler<AuthEvents[EVENT]>
    ): Provider {
        this._emitter.on(event, handler);

        return this;
    }
    once<EVENT extends keyof AuthEvents>(
        event: EVENT,
        handler: Handler<AuthEvents[EVENT]>
    ): Provider {
        this._emitter.once(event, handler);

        return this;
    }
    off<EVENT extends keyof AuthEvents>(
        event: EVENT,
        handler: Handler<AuthEvents[EVENT]>
    ): Provider {
        this._emitter.off(event, handler);

        return this;
    }

    public connect(options: ConnectOptions): Promise<void> {
        this._options = options;
        this.user = {
            address: libs.crypto.address(this._seed, options.NETWORK_BYTE),
            publicKey: libs.crypto.publicKey(this._seed),
        };
        return Promise.resolve();
    }

    public login(): Promise<UserData> {
        return Promise.resolve({
            address: libs.crypto.address(
                this._seed,
                this._options.NETWORK_BYTE
            ),
            publicKey: libs.crypto.publicKey(this._seed),
        });
    }

    public logout(): Promise<void> {
        return Promise.resolve();
    }

    sign<T extends SignerTx>(toSign: T[]): Promise<SignedTx<T>>;
    sign<T extends Array<SignerTx>>(toSign: T): Promise<SignedTx<T>> {
        return Promise.all(
            [...toSign].map((params) =>
                signTx(
                    {
                        chainId: this._options.NETWORK_BYTE,
                        ...(params as TTxParams & WithTxType),
                    },
                    this._seed
                )
            )
        ) as Promise<SignedTx<T>>;
    }

    public signTypedData(data: Array<TypedData>): Promise<string> {
        throw new Error('Not implemented'); // TODO
    }

    public signMessage(data: string | number): Promise<string> {
        return Promise.resolve(
            libs.crypto.signBytes(
                this._seed,
                libs.crypto.stringToBytes(`${data}`)
            )
        );
    }
}
