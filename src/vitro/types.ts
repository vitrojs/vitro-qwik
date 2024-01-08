import type { PropFunction } from '@builder.io/qwik'
import {} from 'vitro'

export type FunctionComponent<P = {}> = JSX.Component<P>

export interface QwikifyBase {
  /**
   * Adds a `click` event listener to the host element, this event will be dispatched even if the Voby component is not hydrated.
   */
  'host:onClick$'?: PropFunction<(ev: Event) => void>

  /**
   * Adds a `blur` event listener to the host element, this event will be dispatched even if the Voby component is not hydrated.
   */
  'host:onBlur$'?: PropFunction<(ev: Event) => void>

  /**
   * Adds a `focus` event listener to the host element, this event will be dispatched even if the Voby component is not hydrated.
   */
  'host:onFocus$'?: PropFunction<(ev: Event) => void>

  /**
   * Adds a `mouseover` event listener to the host element, this event will be dispatched even if the Voby component is not hydrated.
   */
  'host:onMouseOver$'?: PropFunction<(ev: Event) => void>

  children?: any
}

export type TransformProps<PROPS extends {}> = {
  [K in keyof PROPS as TransformKey<K>]: TransformProp<K, PROPS[K]>
}

export type TransformKey<K extends string | number | symbol> =
  K extends `on${string}` ? `${K}$` : K

export type TransformProp<
  K extends string | number | symbol,
  V,
> = K extends `on${string}` ? (V extends Function ? PropFunction<V> : never) : V

export type QwikifyProps<PROPS extends {}> = TransformProps<PROPS> & QwikifyBase

export interface QwikifyOptions {
  tagName?: string
}
