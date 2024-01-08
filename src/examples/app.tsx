/** @jsxImportSource vitro */

import { observable } from '../index.qwik'
import { qwikify$ } from '../vitro/qwikify'
export const App = qwikify$(
  (props: { multiple: number; children?: JSX.Child }) => {
    const count = observable(0)
    const increment = () => count((i) => props.multiple * (i + 1))
    const decrement = () => count((i) => props.multiple * (i - 1))

    return (
      <>
        <div>Hello, this is simple Voby counter</div>
        <p>Count: {count}</p>
        <button onClick={decrement}>Decrement</button>
        <button onClick={increment}>Increment</button>

        <footer>{props.children}</footer>
      </>
    )
  },
)
