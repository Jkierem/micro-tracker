import { Context, Data, Effect, Layer } from 'effect';
import { AuthServiceClient } from './client/AuthServiceClientPb';
import { AuthRequest, AuthResponse } from './client/auth_pb';

export class AuthError
extends Data.TaggedError("AuthError")<{ error: unknown }> {}

declare namespace AuthAdapter {
    type Shape = {
        stuff: () => Effect.Effect<AuthResponse, AuthError>;
    }
}

export class AuthAdapter
extends Context.Tag("AuthAdapter")<
    AuthAdapter,
    AuthAdapter.Shape
>() {
    static Live = Layer.succeed(AuthAdapter, AuthAdapter.of({
        stuff() {
            return Effect.tryPromise({
                try() {
                    const cl = new AuthServiceClient("");
                    const req = new AuthRequest();
                    req.setEmail("whatever");
                    req.setPassword("");
                    return cl.authenticate(req);
                },
                catch(error) {
                    return new AuthError({ error });
                },
            })
        },
    }))
}