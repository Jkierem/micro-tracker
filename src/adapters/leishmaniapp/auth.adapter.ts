import { Context, Data, Effect, Layer } from 'effect';
import { AuthServiceClient } from './client/AuthServiceClientPb';
import { AuthRequest, AuthResponse } from './client/auth_pb';

export class AuthError
extends Data.TaggedError("AuthError")<{ error: unknown }> {}

declare namespace AuthAdapter {
    type Credentials = {
        email: string,
        password: string,
    }

    type Shape = {
        login: (credentials: Credentials) => Effect.Effect<AuthResponse, AuthError>;
    }
}

export class AuthAdapter
extends Context.Tag("AuthAdapter")<
    AuthAdapter,
    AuthAdapter.Shape
>() {
    static Live = Layer.succeed(AuthAdapter, AuthAdapter.of({
        login({ email, password }) {
            return Effect.tryPromise({
                try() {
                    const cl = new AuthServiceClient("");
                    const req = new AuthRequest();
                    req.setEmail(email);
                    req.setPassword(password);
                    return cl.authenticate(req);
                },
                catch(error) {
                    return new AuthError({ error });
                },
            })
        },
    }))
}