import { Effect, Layer, pipe } from 'effect';
import type React from 'react';
import { lazy, Suspense } from 'react';

type LazyProps<Props> = JSX.IntrinsicAttributes &
  (
    | (React.PropsWithoutRef<Props> & React.RefAttributes<React.Component<Props>>)
    | React.PropsWithRef<Props>
  ) & {
    fallback?: React.SuspenseProps['fallback'];
  };

export type EffectComponent<R, Props> = Effect.Effect<React.ComponentType<Props>, never, R>;

type InjectOptions<E> = {
  fallback?: React.SuspenseProps['fallback'],
  displayName?: string
  onError?: (error: E) => React.JSX.Element
}

const setDisplayName = (displayName: string) => <Props,>(comp: React.ComponentType<Props>) => {
  comp.displayName = displayName;
  return comp;
}

export const inject =
  <R, const E>(deps: Layer.Layer<R, E>, { 
    fallback = <></>,
    displayName = "Inject",
    onError = (error: E) => <>Error: {JSON.stringify(error)}</>, 
  }: InjectOptions<E> = {} as any) =>
  <Props,>(comp: EffectComponent<R, Props>) =>
    pipe(
      comp,
      Effect.provide(deps),
      Effect.catchAll(e => {
        return Effect.succeed(() => onError(e));
      }),
      Effect.bindTo('default'),
      (effect) => lazy(() => Effect.runPromise(effect)),
      (Component) => ((props: LazyProps<Props>) => (
        <Suspense fallback={props.fallback ?? fallback}>
          <Component {...props} />
        </Suspense>
      )) as React.ComponentType<LazyProps<Props>>,
      setDisplayName(displayName),
    );

export const injectEffect = <R,E>(
  deps: Effect.Effect<Layer.Layer<R,E>>,
  {
    fallback = <></>,
    displayName = "InjectEffect",
    onError = (error: E) => <>Error: {JSON.stringify(error)}</>,
  }: InjectOptions<E> = {} as any
) => <Props, >(
  comp: EffectComponent<R, Props>
) => pipe(
  deps,
  Effect.flatMap(services => Effect.provide(comp, services)),
  Effect.catchAll(e => {
    return Effect.succeed(() => onError(e));
  }),
  Effect.bindTo("default"),
  (effect) => lazy(() => Effect.runPromise(effect)),
  (Component) => ((props: LazyProps<Props>) => (
    <Suspense fallback={props.fallback ?? fallback}>
      <Component {...props} />
    </Suspense>
  )) as React.ComponentType<LazyProps<Props>>,
  setDisplayName(displayName)
)

type SyncInjectOptions = {
  displayName?: string
}

export const injectSync =
  <R,>(deps: Layer.Layer<R>, { displayName = "Inject" }: SyncInjectOptions = {}) =>
  <Props,>(comp: EffectComponent<R, Props>) =>
    pipe(
      comp, 
      Effect.provide(deps), 
      Effect.runSync,
      setDisplayName(displayName)
    );
