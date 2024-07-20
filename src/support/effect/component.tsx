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

type InjectOptions = {
  fallback?: React.SuspenseProps['fallback'],
  displayName?: string
}

const setDisplayName = (displayName: string) => <Props,>(comp: React.ComponentType<Props>) => {
  comp.displayName = displayName;
  return comp;
}

export const inject =
  <R,>(deps: Layer.Layer<R>, { 
    fallback = <></>,
    displayName = "Inject"
  }: InjectOptions = {}) =>
  <Props,>(comp: EffectComponent<R, Props>) =>
    pipe(
      comp,
      Effect.provide(deps),
      Effect.bindTo('default'),
      (effect) => lazy(() => Effect.runPromise(effect)),
      (Component) => ((props: LazyProps<Props>) => (
        <Suspense fallback={props.fallback ?? fallback}>
          <Component {...props} />
        </Suspense>
      )) as React.ComponentType<LazyProps<Props>>,
      setDisplayName(displayName)
    );

export const injectEffect = <R,>(
  deps: Effect.Effect<Layer.Layer<R>>,
  {
    fallback = <></>,
    displayName = "InjectEffect"
  }: InjectOptions = {}
) => <Props, >(
  comp: EffectComponent<R, Props>
) => pipe(
  deps,
  Effect.flatMap(services => Effect.provide(comp, services)),
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
