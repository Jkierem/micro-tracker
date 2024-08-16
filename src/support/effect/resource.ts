import { Data, Effect, Match, Option, pipe, Resource } from 'effect';
import { useEffect, useMemo, useReducer, useRef } from 'react';

class ResourceLoading extends Data.TaggedClass('Loading') {}
class ResourceSuccess<T> extends Data.TaggedClass('Success')<{ data: T }> {}
class ResourceError<E> extends Data.TaggedError('Error')<{ error: E }> {}
export type Resource<A, E> = ResourceLoading | ResourceSuccess<A> | ResourceError<E>;

export const Loading = () => new ResourceLoading();
export const Success = <A>(data: A) => new ResourceSuccess({ data });
export const Error = <E>(error: E) => new ResourceError({ error });

export const getSuccess = <A, E>(resource: Resource<A, E>): Option.Option<A> =>
  pipe(
    resource,
    Match.value,
    Match.tag('Success', ({ data }) => Option.some(data)),
    Match.orElse(() => Option.none()),
  );

export const getOrElse =
  <A, E>(orElse: () => A) =>
  (res: Resource<A, E>) => {
    return pipe(getSuccess(res), Option.getOrElse(orElse));
  };

class EmptyResource<A> extends Data.TaggedClass('Empty')<{ data: A }> {}
export type EmptiableResource<A, E> = Resource<A, E> | EmptyResource<A>;

export const withEmpty =
  <A>(condition: (resource: A) => boolean) =>
  <E>(resource: Resource<A, E>): EmptiableResource<A, E> => {
    return pipe(
      Match.value(resource),
      Match.tag('Success', ({ data }) => {
        return condition(data) ? new EmptyResource({ data }) : resource;
      }),
      Match.orElse(() => resource),
    );
  };

class AggregatedError<E> extends Data.TaggedError('AggregatedError')<{ errors: E[] }> {}

export const zip =
  <B, E1>(b: Resource<B, E1>) =>
  <A, E0>(a: Resource<A, E0>): Resource<[A, B], AggregatedError<E0 | E1>> => {
    const aTag = a._tag;
    const bTag = b._tag;

    if (aTag === 'Loading' || bTag === 'Loading') {
      return new ResourceLoading();
    }

    if (aTag === 'Error' || bTag === 'Error') {
      const errors = [] as (E0 | E1)[];
      if (aTag === 'Error') {
        errors.push(a.error);
      }
      if (bTag === 'Error') {
        errors.push(b.error);
      }
      return new ResourceError({ error: new AggregatedError({ errors }) });
    }

    return new ResourceSuccess({
      data: [a.data, b.data],
    });
  };

type Combined<R extends Record<string, Resource<any, any>>> = Resource<
  {
    [P in keyof R]: R[P] extends Resource<infer A, any> ? A : never;
  },
  {
    [P in keyof R]: R[P] extends Resource<any, infer E> ? E : never;
  }[keyof R][]
>;

export const all = <const R extends Record<string, Resource<any, any>>>(
  resources: R,
): Combined<R> => {
  const entries = Object.entries(resources);

  if (entries.some(([, res]) => res._tag === 'Loading')) {
    return new ResourceLoading();
  }

  if (entries.some(([, res]) => res._tag === 'Error')) {
    const errors = Object.fromEntries(
      entries
        .filter(([, res]) => res._tag === 'Error')
        .map(([key, res]) => [key, (res as ResourceError<unknown>).error]),
    );
    return new ResourceError({ error: errors }) as unknown as Combined<R>;
  }

  const data = Object.fromEntries(
    entries.map(([key, res]) => [key, (res as ResourceSuccess<unknown>).data]),
  );
  return new ResourceSuccess({ data }) as unknown as Combined<R>;
};

const resourceReducer = <A, E>(_: Resource<A, E>, action: Resource<A, E>) => {
  return action;
};

type Refetch<A, E> = (options?: { swr?: boolean }) => Option.Option<Promise<Resource<A, E>>>;

export type ResourceHook<A, E, R> = (
  args: () => Option.Option<R>,
  dependencies: unknown[],
) => [Resource<A, E>, Refetch<A, E>];

export type FreeResourceHook<A, E> = () => [Resource<A, E>, Refetch<A, E>];

export const makeResourceHook =
  <A, E, R>(resource: (args: R) => Effect.Effect<A, E>): ResourceHook<A, E, R> =>
  (args: () => Option.Option<R>, deps: unknown[]) => {
    const ref = useRef(true);
    const [current, dispatch] = useReducer(resourceReducer<A, E>, new ResourceLoading());

    const fetch = useMemo(() => {
      return ({ swr }: { swr?: boolean } = { swr: false }) =>
        pipe(
          args(),
          Option.map((arg) => {
            if (!swr) {
              dispatch(new ResourceLoading());
            }
            return pipe(
              resource(arg),
              Effect.map((data) => {
                dispatch(new ResourceSuccess({ data }));
                return new ResourceSuccess({ data }) as Resource<A, E>;
              }),
              Effect.catchAll((error) => {
                return Effect.sync(() => {
                  dispatch(new ResourceError({ error }));
                  return new ResourceError({ error }) as Resource<A, E>;
                });
              }),
              Effect.runPromise,
            );
          }),
        );
    }, [args, dispatch, ...deps]);

    useEffect(() => {
      if( ref.current ){
        ref.current = false;
        fetch({ swr: false });
      }
    }, [fetch]);

    return [current, fetch] as [Resource<A, E>, Refetch<A, E>];
  };

export const makeFreeResourceHook = 
  <A, E>(resource: () => Effect.Effect<A, E>): FreeResourceHook<A, E> => {
    return () => makeResourceHook(resource)(() => Option.void, []);
  }

export const map =
  <A, B>(mapper: (a: A) => B) =>
  <E>(self: Resource<A, E>) => {
    return pipe(
      Match.value(self),
      Match.tag('Success', ({ data }) => new ResourceSuccess({ data: mapper(data) })),
      Match.orElse(() => self as Resource<B, E>),
    );
  };

export const tap =
  <A>(tapper: (a: A) => void) =>
  <E>(self: Resource<A, E>) => {
    return map<A, A>((a: A) => {
      tapper(a);
      return a;
    })<E>(self);
  };

export const flat = <A, E, E1>(self: Resource<Resource<A, E1>, E>): Resource<A, E | E1> => {
  return pipe(
    Match.value(self),
    Match.tag('Success', ({ data }) => {
      return pipe(
        Match.value(data),
        Match.tag('Success', ({ data }) => new ResourceSuccess({ data })),
        Match.tag('Error', ({ error }) => new ResourceError({ error })),
        Match.orElse(() => new ResourceLoading()),
      );
    }),
    Match.tag('Error', ({ error }) => new ResourceError({ error })),
    Match.orElse(() => new ResourceLoading()),
  );
};

export const flatMap =
  <A, B, E1>(fn: (a: A) => Resource<B, E1>) =>
  <E>(self: Resource<A, E>) => {
    return pipe(self, map(fn), flat);
  };

export const toOption = <A, E>(res: Resource<A, E>) =>
  pipe(
    Match.value(res),
    Match.tag('Success', ({ data }) => Option.some(data)),
    Match.orElse(() => Option.none()),
  );

export const fromOption =
  <E>(onNone: () => E) =>
  <A>(self: Option.Option<A>): Resource<A, E> => {
    return pipe(
      self,
      Option.map((data) => new ResourceSuccess({ data })),
      Option.getOrElse(() => new ResourceError({ error: onNone() })),
    );
  };

export const bindTo =
  <const Key extends string, A, E>(key: Exclude<Key, keyof A>) =>
  (self: Resource<A, E>): Resource<{ [P in Key]: A }, E> => {
    return pipe(
      self,
      map((data) => ({ [key]: data }) as { [P in Key]: A }),
    );
  };

export const bind =
  <const Key extends string, A extends object, B, E1>(
    key: Exclude<Key, keyof A>,
    fn: (a: A) => Resource<B, E1>,
  ) =>
  <E>(
    self: Resource<A, E>,
  ): Resource<{ [P in keyof A | Key]: P extends keyof A ? A[P] : B }, E | E1> => {
    return pipe(
      self,
      flatMap((a) => {
        return pipe(
          fn(a),
          map(
            (b: B) =>
              ({ ...a, [key]: b }) as { [P in keyof A | Key]: P extends keyof A ? A[P] : B },
          ),
        );
      }),
    );
  };

export const Do = Success({}) as Resource<{}, never>;

export const catchAll =
  <E, E0, B>(fn: (err: E) => Resource<B, E0>) =>
  <A>(self: Resource<A, E>): Resource<A | B, E0> => {
    return pipe(
      self,
      Match.value,
      Match.tag('Error', (e) => fn(e.error)),
      Match.orElse(() => self as Resource<A, never>),
    );
  };

export const recover =
  <E, B>(fn: (e: E) => B) =>
  <A>(self: Resource<A, E>): Resource<A | B, never> => {
    return pipe(
      self,
      catchAll((e) => Success(fn(e))),
    );
  };