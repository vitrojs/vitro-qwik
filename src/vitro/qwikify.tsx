/* @jsxImportSource @builder.io/qwik */
import {
  RenderOnce,
  SkipRender,
  Slot,
  component$,
  implicit$FirstArg,
  noSerialize,
  useSignal,
  useStylesScoped$,
  useTask$,
  type NoSerialize,
  type QRL,
} from '@builder.io/qwik'

import { isBrowser } from '@builder.io/qwik/build'
import * as client from './client'
import { getHostProps, main } from './slot'

import type { FunctionComponent, QwikifyOptions, QwikifyProps } from './types'

export function qwikifyQrl<PROPS extends {}>(
  vitroCmp$: QRL<FunctionComponent<PROPS & { children?: any }>>,
  opts?: QwikifyOptions,
) {
  return component$((props: QwikifyProps<PROPS>) => {
    const { scopeId } = useStylesScoped$(
      `q-slot{display:none} q-slotc,q-slotc>q-slot{display:contents}`,
    )
    const hostRef = useSignal<Element>()
    const slotRef = useSignal<Element>()
    const vobyCmp = useSignal<NoSerialize<FunctionComponent<PROPS>>>()
    const dispose = useSignal<NoSerialize<() => void>>()
    const TagName = opts?.tagName ?? ('qwik-vitro' as any)

    // Task takes cares of updates and partial hydration
    useTask$(async ({ track, cleanup }) => {
      const trackedProps = track(() => ({ ...props }))

      if (!isBrowser) {
        return
      }

      const cmp = await vitroCmp$.resolve()

      vobyCmp.value = noSerialize(cmp)

      // Root props update
      if (hostRef.value) {
        dispose.value?.()
        const disposeFn = client.render(
          main(slotRef.value, scopeId, vobyCmp.value, trackedProps),
          hostRef.value,
        )
        dispose.value = noSerialize(disposeFn)
      }

      cleanup(() => {
        dispose.value?.()
      })
    })

    return (
      <RenderOnce>
        <TagName
          {...getHostProps(props)}
          ref={(el: Element) => {
            if (isBrowser) {
              hostRef.value = el
              queueMicrotask(() => {
                const disposeFn = client.render(
                  main(slotRef.value, scopeId, vobyCmp.value, props),
                  el,
                )
                dispose.value = noSerialize(disposeFn)
              })
            }
          }}
        >
          {SkipRender}
        </TagName>
        <q-slot ref={slotRef}>
          <Slot></Slot>
        </q-slot>
      </RenderOnce>
    )
  })
}

export const qwikify$ = /*#__PURE__*/ implicit$FirstArg(qwikifyQrl)
