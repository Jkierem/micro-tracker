import { Option, pipe } from 'effect'

export declare namespace Optics {
    export type Get<S, A> = (s: S) => A;
    export type Set<S, A> = (s: S, a: A) => S;

    export interface Iso<S, A> {
      combine<B>(other: Iso<A, B>): Iso<S, B>
    }
    
    export interface Read<S, A> extends Iso<S, A> {
      read(s: S): A
      memo(): Read<S, A>;
    }
      
    export interface Write<S, A, WO=S, RO=A> extends Read<S, RO> {
      update(fn: (a: A) => A): (s: S) => WO;
      toConstant(c: A): (s: S) => WO;
    }
      
    export interface Readonly<S, A> extends Read<S, A> {
      filterOrElse<B extends A>(predicate: (a: A) => a is B, orElse: () => B): Read<S, B>;
      toLens(setter: Optics.Set<S,A>): Lens<S, A>;
      at<K extends keyof A>(k: K): Readonly<S, A[K]>;
      map<B>(fn: (a: A) => B): Readonly<S, B>
      flatMap<B>(fn: (a: A) => Readonly<A,B>): Readonly<S, B>;
      filter<B extends A>(predicate: (a: A) => a is B): ReadonlyPrism<S, B>;
    }

    export interface ReadonlyPrism<S, A> extends Read<S, Option.Option<A>> {
      at<K extends keyof A>(k: K): ReadonlyPrism<S, NonNullable<A[K]>>;
      map<B>(fn: (a: A) => B): ReadonlyPrism<S, B>
      flatMap<B>(fn: (a: A) => ReadonlyPrism<A,B>): ReadonlyPrism<S, B>;
      filter<B extends A>(predicate: (a: A) => a is B): ReadonlyPrism<S, B>;
      orElse(fallback: () => A): Readonly<S, A>;
    }

    export interface Lens<S,A> extends Write<S, A >{
      toReadonly(): Readonly<S, A>
    }

    export interface Prism<S, A> extends Write<S, A, Option.Option<S>, Option.Option<A>>{
      toReadonly(): ReadonlyPrism<S, A>;
      filter<B extends A>(predicate: (a: A) => a is B): Prism<S, B>;
      at<K extends keyof A>(attr: K): Prism<S, NonNullable<A[K]>>;
      orElse(fallback: () => A): Readonly<S, A>;
    }
}

export class Iso<S, A> implements Optics.Iso<S,A> {
    private constructor(public view: (s: S) => A, public review: (a: A) => S) {}
  
    static make<S, A>(view: (s: S) => A, review: (a: A) => S): Iso<S, A> {
      return new Iso(view, review)
    }
  
    static id<A, S>() {
      return new Iso<A, S>(
        (x) => x as unknown as S,
        (x) => x as unknown as A,
      )
    }
    /**
     * Combine Iso<A,B> and Iso<B,C> into a new Iso<A,C>
     * @param other
     */
    combine<B>(other: Iso<A, B>): Iso<S, B> {
      return new Iso(
        (s: S) => other.view(this.view(s)),
        (b: B) => this.review(other.review(b)),
      )
    }
}

function shallowSet<T, K extends keyof T>(attr: K): (s: T, a: T[K]) => T {
  return (s: T, a: T[K]) => ({ ...s, [attr]: a })
}

function shallowGet<T, K extends keyof T>(attr: K): (s: T) => T[K] {
  return (s: T) => s[attr]
}

function safeShallowGet<T, K extends keyof T>(attr: K): (s: T) => T[K] | undefined {
  return (s: T) => s?.[attr]
}

function memoize<S,A>(fn: (s: S) => A){
  const memo = new Map();
  return (s: S) => {
    if( !memo.get(s) ){
      memo.set(s, fn(s));
    }
    return memo.get(s);
  }
}

export class Readonly<S, A> implements Optics.Readonly<S, A> {
    private constructor(private getter: Optics.Get<S, A>) {}
  
    static make<S, A>(getter: Optics.Get<S, A>) {
      return new Readonly(getter)
    }
    /**
     * Creates a readonly lens that reads an attribute
     */
    static attr<T, K extends keyof T>(attr: K) {
      return new Readonly<T, T[typeof attr]>(shallowGet(attr))
    }
  
    public static id<S>() {
      return Readonly.make<S, S>((x) => x)
    }
  
    public read(s: S): A {
      return this.getter(s)
    }
  
    public combine<B>(other: Readonly<A, B>): Readonly<S, B> {
      return new Readonly(
        (s: S) => other.getter(this.getter(s)),
      )
    }
  
    public at<K extends keyof A>(k: K): Readonly<S, A[K]> {
      const next = Readonly.make(safeShallowGet<A, K>(k) as (s: A) => A[K])
      return this.combine(next)
    }

    public toLens(setter: Optics.Set<S,A>){
        return Lens.make(this.getter, setter);
    }

    filter<B extends A>(predicate: (a: A) => a is B): Optics.ReadonlyPrism<S, B> {
      return ReadonlyPrism.make((s: S) => {
        return Option.liftPredicate(predicate)(this.getter(s));
      })
    }

    public map<B>(fn: (a: A) => B) {
        return this.combine(Readonly.make(fn));
    }

    public flatMap<B>(fn: (a: A) => Readonly<A,B>){
        return new Readonly((s: S) => {
            const a = this.read(s)
            const ra = fn(a);
            return ra.read(a)
        })
    }

    public filterOrElse<B extends A>(predicate: (a: A) => a is B, orElse: () => B): Optics.Read<S, B> {
      return this.map(a => {
        if( predicate(a) ){
          return a
        }
        return orElse()
      })
    }

    public memo(): Optics.Read<S, A> {
      return new Readonly(memoize((s: S) => this.getter(s)));
    }
}
  
export class Lens<S, A> implements Optics.Lens<S,A> {
    static Readonly = Readonly;
  
    private constructor(private getter: Optics.Get<S, A>, private setter: Optics.Set<S, A>) {}
  
    static make<S, A>(getter: Optics.Get<S, A>, setter: Optics.Set<S, A>) {
      return new Lens(getter, setter)
    }
    /**
     * Creates a lens that reads an attribute
     */
    static attr<T, K extends keyof T>(attr: K) {
      return new Lens<T, T[typeof attr]>(shallowGet(attr), shallowSet(attr))
    }
  
    static id<S>() {
      return Lens.make<S, S>(
        (x) => x,
        (x) => x,
      )
    }
  
    public read(s: S): A {
      return this.getter(s)
    }
  
    public update(fn: (a: A) => A): (s: S) => S {
      return (s: S) => this.setter(s, fn(this.getter(s)))
    }
  
    public toConstant(c: A): (s: S) => S {
      return this.update(() => c)
    }
  
    public combine<B>(other: Lens<A, B>): Lens<S, B> {
      return new Lens(
        (s: S) => other.getter(this.getter(s)),
        (s: S, b: B) => this.setter(s, other.setter(this.getter(s), b)),
      )
    }
  
    public at<K extends keyof A>(k: K): Lens<S, A[K]> {
      const next = Lens.make(safeShallowGet<A, K>(k) as Optics.Get<A, A[K]>, shallowSet<A, K>(k))
      return this.combine(next)
    }
  
    public toReadonly(){
      return Readonly.make(this.getter);
    }

    public memo(): Optics.Read<S, A> {
      return this.toReadonly().memo();
    }
}

export class ReadonlyPrism<S,A> implements Optics.ReadonlyPrism<S,A> {
  private constructor(private getter: Prism.Get<S, A>){}

  public static make<S, A>(getter: Prism.Get<S, A>){
    return new ReadonlyPrism(getter);
  }

  public static id<S>(){
    return new ReadonlyPrism((s: S) => Option.fromNullable(s));
  }

  at<K extends keyof A>(k: K) {
    return ReadonlyPrism.make((s: S) => pipe(
      this.getter(s),
      Option.flatMap(op => Option.fromNullable(op[k]))
    ))
  }

  map<B>(fn: (a: A) => B): Optics.ReadonlyPrism<S, B> {
    return ReadonlyPrism.make((s: S) => pipe(
      this.getter(s),
      Option.map(fn)
    ))
  }

  flatMap<B>(fn: (a: A) => Optics.ReadonlyPrism<A, B>): Optics.ReadonlyPrism<S, B> {
    return ReadonlyPrism.make((s: S) => pipe(
      this.getter(s),
      Option.flatMap(a => fn(a).read(a))
    ))
  }

  filter<B extends A>(predicate: (a: A) => a is B): Optics.ReadonlyPrism<S, B> {
    return ReadonlyPrism.make((s: S) => {
      const ma = this.read(s);
      return ma.pipe(Option.filter(predicate));
    })
  }

  read(s: S): Option.Option<A> {
    return this.getter(s);
  }

  memo(): Optics.Read<S, Option.Option<A>> {
    return Readonly.make<S, Option.Option<A>>(s => this.getter(s)).memo();
  }

  combine<B>(other: Optics.ReadonlyPrism<A, B>): Optics.ReadonlyPrism<S, B> {
    return ReadonlyPrism.make((s: S) => {
      return this.read(s).pipe(Option.flatMap(a => other.read(a)));
    })
  }

  orElse(fallback: () => A): Optics.Readonly<S, A> {
    return Readonly.make((s: S) => this.read(s).pipe(Option.getOrElse(fallback)))
  }
}

export declare namespace Prism {
  export type Get<S, A> = (s: S) => Option.Option<A>;
  export type Set<S, A> = (s: S, a: A) => Option.Option<S>;
}

export class Prism<S, A> implements Optics.Prism<S, A> {
  static Readonly = ReadonlyPrism;

  private constructor(
    private getter: Prism.Get<S, A>,
    private setter: Prism.Set<S, A>
  ){}

  static make<S,A>(
    getter: Prism.Get<S, A>,
    setter: Prism.Set<S, A>
  ){ return new Prism<S, A>(getter, setter) }

  /**
   * Creates a base Prism that leaves the structure unchanged. Good as a base for more complex Prisms.
   */
  static id<S>(){
    return Prism.make<S, S>(
        (a) => Option.fromNullable(a),
        (s, a) => pipe(
            Option.fromNullable(s),
            Option.map(() => a)
        )
    )
  }

  static attr<T, K extends keyof T>(attr: K) {
    return Prism.id<T>().at(attr);
  }

 /**
   * Creates a new Prism that attempts to read an attribute from the sub structure
   */
  at<K extends keyof A>(attr: K): Prism<S, NonNullable<A[K]>> {
    const next = Prism.make<A, NonNullable<A[K]>>(
        (a: A) =>
          pipe(
            Option.fromNullable(a),
            Option.flatMap((a) => Option.fromNullable(a[attr])),
          ),
        (s: A, a: A[K]) => pipe(
            Option.fromNullable(s), 
            Option.map(s => ({
                ...s,
                [attr]: a
            })),
      ))
  
    return this.combine(next);
  }
  /**
   * Attempts to read from a structure. If the read is not possible, returns None. Otherwise Some of the sub structure
   */
  read(s: S): Option.Option<A> {
    return this.getter(s);
  }
  /**
   * Attempts to set a sub structure to a constant value. If setting the sub structure is not possible, returns None.
   * Otherwise returns Some of the updated structure.
   */
  toConstant(a: A): (s: S) => Option.Option<S> {
    return this.update(() => a);
  }
  /**
   * Attempts to update a sub structure using an update function. If setting the sub structure is not possible, return None.
   * Otherwise returns Some of the updated structure.
   */
  update(fn: (s: A) => A): (s: S) => Option.Option<S> {
    return (s: S) =>
      pipe(
        this.getter(s),
        Option.map(fn),
        Option.flatMap((a) => this.setter(s, a)),
      );
  }
  /**
   * Creates a new Prism from the composition of two prisms.
   */
  combine<B>(other: Prism<A, B>): Prism<S, B> {
    return Prism.make(
        (s: S) => pipe(this.getter(s), Option.flatMap(a => other.read(a))),
        (s: S, b: B) =>
          pipe(
            this.getter(s),
            Option.flatMap((a) => other.toConstant(b)(a)),
            Option.flatMap((a) => this.setter(s, a)),
          ),
      );
  }

  toReadonly(): Optics.ReadonlyPrism<S, A> {
    return ReadonlyPrism.make(this.getter);
  }

  filter<B extends A>(predicate: (a: A) => a is B): Optics.Prism<S, B> {
    return Prism.make(
      (s: S) => pipe(
        this.getter(s), 
        Option.filter(predicate)
      ),
      (s: S, a: B) =>
        pipe(
          this.getter(s),
          Option.filter(predicate),
          Option.flatMap(() => this.setter(s, a)),
        ),
    );
  }

  orElse(fallback: () => A): Optics.Readonly<S, A> {
    return Readonly.make((s: S) => this.read(s).pipe(Option.getOrElse(fallback)))
  }

  public memo(): Optics.Read<S, Option.Option<A>> {
    return this.toReadonly().memo();
  }
}