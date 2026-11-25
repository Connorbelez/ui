// @vitest-environment jsdom
import * as React from "react"
import { hydrateRoot, type Root } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { afterEach, expect, test, vi } from "vitest"
import { Tree, TreeGroup, TreeItem, TreeItemLabel } from "../src/tree"

Element.prototype.getAnimations ??= () => []

let root: Root | undefined

afterEach(() => {
  vi.restoreAllMocks()
  root?.unmount()
  root = undefined
  document.body.replaceChildren()
})

type File = { value: string; children?: File[] }

const files: File[] = [
  {
    value: "src",
    children: [
      { value: "components", children: [{ value: "button.tsx" }] },
      { value: "index.ts" },
    ],
  },
]

// Busy past React's 5ms slice, so a transition yields before the next item.
function Slow() {
  const until = performance.now() + 10
  while (performance.now() < until) {}
  return null
}

function Items({ items }: { items: File[] }) {
  return items.map((item) => (
    <TreeItem key={item.value} value={item.value}>
      <TreeItemLabel>{item.value}</TreeItemLabel>
      {item.children && (
        <TreeGroup>
          <Slow />
          <Items items={item.children} />
        </TreeGroup>
      )}
    </TreeItem>
  ))
}

test("a tree hydrated in a transition that yields matches the server's levels", async () => {
  const { promise: hydrated, resolve } = Promise.withResolvers<void>()
  function App() {
    React.useEffect(resolve, [])
    return (
      <Tree aria-label="Files" defaultExpanded={["src", "components"]}>
        <Items items={files} />
      </Tree>
    )
  }
  const container = document.body.appendChild(document.createElement("div"))
  container.innerHTML = renderToString(<App />)
  const errors = vi.spyOn(console, "error").mockImplementation(() => {})
  React.startTransition(() => {
    root = hydrateRoot(container, <App />)
  })
  await hydrated
  expect(errors.mock.calls).toEqual([])
  const leaf = container.querySelector<HTMLElement>(
    '[role="treeitem"] [role="treeitem"] [role="treeitem"]'
  )!
  expect(leaf.getAttribute("aria-level")).toBe("3")
  expect(leaf.dataset.level).toBe("3")
  expect(leaf.style.getPropertyValue("--tree-level")).toBe("3")
})
