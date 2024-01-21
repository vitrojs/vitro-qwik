import { $, useOnDocument, useSignal } from '@builder.io/qwik'
import { isServer } from '@builder.io/qwik/build'
import { createElement } from 'vitro'
import type { QwikifyOptions, QwikifyProps } from './types'
export function main(
  slotEl: Element | undefined,
  scopeId: string,
  RootCmp: any,
  props: any,
) {
  return mainExactProps(slotEl, scopeId, RootCmp, getVitroProps(props))
}

export function mainExactProps(
  slotEl: Element | undefined,
  scopeId: string,
  RootCmp: any,
  props: any,
) {
  return createElement(RootCmp, {
    ...props,
    children: createElement(SlotElement, {
      slotEl,
      scopeId,
    }),
  })
}
const SlotElement = (props: {
  slotEl: Element | undefined
  scopeId: string
}) => {
  const mount = (el: Element) => {
    props.slotEl && el.appendChild(props.slotEl)
  }

  // @ts-expect-error since q-slotc is not a standard element, we will get error
  return createElement('q-slotc', {
    class: props.scopeId,
    suppressHydrationWarning: true,
    dangerouslySetInnerHTML: { __html: '<!--SLOT-->' },
    ref: mount,
  })
}

export const getVitroProps = (
  props: Record<string, any>,
): Record<string, any> => {
  const obj: Record<string, any> = {}
  Object.keys(props).forEach((key) => {
    if (!key.startsWith(HOST_PREFIX)) {
      const normalizedKey = key.endsWith('$') ? key.slice(0, -1) : key
      obj[normalizedKey] = props[key]
    }
  })
  return obj
}

export const getHostProps = (
  props: Record<string, any>,
): Record<string, any> => {
  const obj: Record<string, any> = {}
  Object.keys(props).forEach((key) => {
    if (key.startsWith(HOST_PREFIX)) {
      obj[key.slice(HOST_PREFIX.length)] = props[key]
    }
  })
  return obj
}

export const useWakeupSignal = (
  props: QwikifyProps<{}>,
  opts: QwikifyOptions = {},
) => {
  const signal = useSignal(false)
  const activate = $(() => (signal.value = true))
  if (isServer) {
    // vitro component is client-only
    useOnDocument('qinit', activate)
  }
  return [signal, activate] as const
}

const HOST_PREFIX = 'host:'
