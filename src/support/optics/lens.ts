import { Option, pipe } from "effect";
import { memoize, safeShallowGet, shallowSet } from "./optics.helpers";
import { Prism, ReadonlyPrism } from "./prism";
import { Optics } from "./types";

export class Lens<S, A> {
    private constructor(
      private getter: Optics.Get<S, A>,
      private setter: Optics.Set<S, A>,
    ) {
    }
  
    static make<S, A>(getter: Optics.Get<S, A>, setter: Optics.Set<S, A>) {
      return new Lens(getter, setter);
    }
  
    static id<S>() {
      return Lens.make<S, S>(
        (x) => x,
        (_, x) => x,
      );
    }
  
    get(s: S): A {
      return this.getter(s);
    }
  
    memo(): Lens<S, A> {
      const memoized = memoize((s: S) => this.getter(s));
      return new Lens(memoized, (s, a) => this.setter(s, a));
    }
    
    set(c: A): (s: S) => S {
      return (s: S) => this.setter(s, c);
    }
  
    update(fn: (a: A) => A): (s: S) => S {
      return (s: S) => this.setter(s, fn(this.getter(s)));
    }
  
    combine<B>(other: Lens<A, B>): Lens<S, B> {
      return new Lens(
        (s: S) => other.get(this.getter(s)),
        (s: S, b: B) => this.setter(s, other.set(b)(this.get(s))),
      );
    }
  
    imap<B>(mapper: (a: A) => B, contra: (b: B) => A): Lens<S, B> {
      return new Lens(
        s => mapper(this.get(s)),
        (s, a) => this.set(contra(a))(s)
      )
    }
  
    at<K extends keyof A>(k: K): Lens<S, A[K]> {
      const next = Lens.make(
        safeShallowGet<A, K>(k) as Optics.Get<A, A[K]>, 
        shallowSet<A, K>(k)
      );
  
      return this.combine(next);
    }

    toReadonly(){
        return ReadonlyLens.make((s: S) => this.getter(s));
    }

    filter<B extends A>(predicate: (a: A) => a is B): Prism<S, B>;
    filter(predicate: (a: A) => boolean): Prism<S, A>;
    filter<B extends A>(predicate: (a: A) => a is B): Prism<S, B> {
        return Prism.make(
            (s: S) => pipe(
                this.getter(s),
                Option.liftPredicate(predicate)
            ),
            (s: S, b: B) => {
                return pipe(
                    this.getter(s),
                    Option.liftPredicate(predicate),
                    Option.map(() => this.setter(s, b))
                )
            }
        );
    }
}

export class ReadonlyLens<S, A> {
    private constructor(
        private getter: Optics.Get<S, A>
    ){}

    static make<S,A>(getter: Optics.Get<S, A>){
        return new ReadonlyLens(getter);
    }

    at<K extends keyof A>(k: K): ReadonlyLens<S, A[K]> {
        const next = ReadonlyLens.make(
          safeShallowGet<A, K>(k) as Optics.Get<A, A[K]>,
        );
    
        return this.combine(next);
    }

    get(s: S){
        return this.getter(s);
    }

    map<B>(mapper: (a: A) => B){
        return new ReadonlyLens((s: S) => mapper(this.getter(s)));
    }

    contraMap<B>(contra: (b: B) => S){
        return new ReadonlyLens((b: B) => this.getter(contra(b)));
    }

    combine<B>(other: ReadonlyLens<A, B>): ReadonlyLens<S, B> {
        return new ReadonlyLens((s: S) => other.get(this.getter(s)));
    }

    filter<B extends A>(predicate: (a: A) => a is B): ReadonlyPrism<S, B>;
    filter(predicate: (a: A) => boolean): ReadonlyPrism<S, A>;
    filter<B extends A>(predicate: (a: A) => a is B): ReadonlyPrism<S, B> {
        return ReadonlyPrism.make((s: S) => Option.liftPredicate(predicate)(this.getter(s)));
    }
}