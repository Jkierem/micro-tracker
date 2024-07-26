import { Option, pipe } from "effect";
import { memoize, uncurryShallowSet } from "./optics.helpers";

type ItemOf<A> = A extends (infer I)[] ? I : never

export class Prism<S, A> {
    private constructor(
        private getter: (s: S) => Option.Option<A>,
        private setter: (s: S, a: A) => Option.Option<S>  
    ){}

    static make<S,A>(
        getter: (s: S) => Option.Option<A>,
        setter: (s: S, a: A) => Option.Option<S>  
    ){
        return new Prism(getter, setter);
    }

    static id<S>(){
        return Prism.make<S, S>(
            a => Option.fromNullable(a),
            (s, a) => {
                return pipe(
                    Option.fromNullable(s),
                    Option.map(() => a)
                )
            }
        )
    }

    set(c: A): (s: S) => Option.Option<S> {
        return this.update(() => c);
    }

    at<const K extends keyof A>(attr: K): Prism<S, NonNullable<A[K]>> {
        const next = Prism.make<A, NonNullable<A[K]>>(
          (a: A) =>
            pipe(
              Option.fromNullable(a),
              Option.flatMap((a) => Option.fromNullable(a[attr])),
            ),
          (s: A, a: A[K]) =>
            pipe(
              Option.fromNullable(s),
              Option.map((s) => uncurryShallowSet(attr, s, a)),
            ),
        );
    
        return this.combine(next);
    }

    update(fn: (a: A) => A): (s: S) => Option.Option<S> {
        return (s: S) => pipe(
            this.getter(s),
            Option.map(fn),
            Option.flatMap((a) => this.setter(s, a))
        )
    }

    get(s: S): Option.Option<A> {
        return this.getter(s);
    }

    memo(): Prism<S, A> {
        const memoized = memoize((s: S) => this.getter(s));
        return new Prism(memoized, (s, a) => this.setter(s, a));
    }

    combine<B>(other: Prism<A, B>): Prism<S, B> {
        return Prism.make(
            (s: S) =>
                pipe(
                this.getter(s),
                Option.flatMap((a) => other.get(a)),
                ),
            (s: S, b: B) =>
                pipe(
                this.getter(s),
                Option.flatMap((a) => other.update(() => b)(a)),
                Option.flatMap((a) => this.setter(s, a)),
            )
        )
    }

    toReadonly(){
        return ReadonlyPrism.make((s: S) => this.getter(s));
    }

    find<B extends ItemOf<A>>(predicate: (a: ItemOf<A>) => boolean): Prism<S, NonNullable<B>> {
        const next = Prism.make<A, NonNullable<B>>(
          (a: A) =>
            pipe(
              Option.fromNullable(a),
              Option.filter<any, any[]>(Array.isArray),
              Option.flatMap((a) => {
                return Option.fromNullable(a.find(predicate));
              }),
            ),
          (s: A, a: B) =>
            pipe(
              Option.fromNullable(s),
              Option.filter<any, any[]>(Array.isArray),
              Option.flatMap((s) => {
                const idx = s.findIndex(predicate);
                if (idx >= 0) {
                  const next = uncurryShallowSet(idx, s, a) as A;
                  return Option.some<A>(next);
                }
                return Option.none();
              }),
            ),
        );
    
        return this.combine(next);
      }
    
    filter<B extends A>(predicate: (a: A) => a is B): Prism<S, B>;
    filter(predicate: (a: A) => boolean): Prism<S, A>;
    filter<B extends A>(predicate: (a: A) => a is B): Prism<S, B> {
        return Prism.make(
          (s: S) => pipe(this.getter(s), Option.filter(predicate)),
          (s: S, a: B) =>
            pipe(
              this.getter(s),
              Option.filter(predicate),
              Option.flatMap(() => this.setter(s, a)),
            ),
        );
    }
}

export class ReadonlyPrism<S, A>{
    private constructor(
        private getter: (s: S) => Option.Option<A>
    ) {}
  
    public static make<S, A>(getter: (s: S) => Option.Option<A>) {
      return new ReadonlyPrism(getter);
    }
  
    public static id<S>() {
      return new ReadonlyPrism((s: S) => Option.fromNullable(s));
    }
  
    at<K extends keyof A>(k: K) {
      return ReadonlyPrism.make((s: S) =>
        pipe(
          this.getter(s),
          Option.flatMap((op) => Option.fromNullable(op[k])),
        ),
      );
    }
  
    map<B>(fn: (a: A) => B): ReadonlyPrism<S, B> {
      return ReadonlyPrism.make((s: S) => pipe(this.getter(s), Option.map(fn)));
    }
  
    flatMap<B>(fn: (a: A) => ReadonlyPrism<A, B>): ReadonlyPrism<S, B> {
      return ReadonlyPrism.make((s: S) =>
        pipe(
          this.getter(s),
          Option.flatMap((a) => fn(a).get(a)),
        ),
      );
    }
  
    filter<B extends A>(predicate: (a: A) => a is B): ReadonlyPrism<S, B>;
    filter(predicate: (a: A) => boolean): ReadonlyPrism<S, A>;
    filter<B extends A>(predicate: (a: A) => a is B): ReadonlyPrism<S, B> {
      return ReadonlyPrism.make((s: S) => {
        return pipe(
            this.get(s),
            Option.filter(predicate)
        );
      });
    }
  
    get(s: S): Option.Option<A> {
      return this.getter(s);
    }
  
    combine<B>(other: ReadonlyPrism<A, B>): ReadonlyPrism<S, B> {
      return ReadonlyPrism.make((s: S) => this.get(s).pipe(Option.flatMap((a) => other.get(a))));
    }
    memo(): ReadonlyPrism<S, A> {
        const memoized = memoize((s: S) => this.getter(s));
        return new ReadonlyPrism(memoized);
    }
  }