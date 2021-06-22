import { constVoid } from 'fp-ts/function'
import Graph from 'graph-data-structure'
import { match } from 'ts-pattern'

import {
  Child,
  Digraph,
  Subgraph,
  EdgeStatement,
  NodeStatement,
} from './Digraph'

export type Graph = ReturnType<typeof Graph>

export type ServiceGraph = {
  incoming: Graph
  outgoing: Graph
}

const serviceGraph = (): ServiceGraph => ({
  incoming: Graph(),
  outgoing: Graph(),
})

const constructGraphWorker = (
  graph: ServiceGraph,
  children: ReadonlyArray<Child>,
): ServiceGraph => {
  for (const child of children) {
    match(child)
      .when(NodeStatement.is, ({ node_id: { id } }) => {
        graph.incoming.addNode(id)
        graph.outgoing.addNode(id)
      })
      .when(EdgeStatement.is, ({ edge_list: [{ id: a }, { id: b }] }) => {
        graph.incoming.addEdge(b, a)
        graph.outgoing.addEdge(a, b)
      })
      .when(Subgraph.is, ({ children }) =>
        constructGraphWorker(graph, children),
      )
      .otherwise(constVoid)
  }

  return graph
}

export const constructGraph = (digraph: Digraph): ServiceGraph => {
  return constructGraphWorker(serviceGraph(), digraph[0].children)
}

/**
 * Use the `neighborAccessor` function to walk over nodes in a graph,
 * returning the set of visited nodes.
 */
const walkGraph = (graph: ServiceGraph, startingNodes: readonly string[]) => (
  neighborAccessor: (graph: ServiceGraph, node: string) => string[],
) => {
  const visited = new Set<string>()
  const next = Array.from(startingNodes)

  while (next.length > 0) {
    const node = next.pop()
    if (node === undefined || visited.has(node)) {
      continue
    }
    visited.add(node)
    next.push(...neighborAccessor(graph, node))
  }

  return visited
}

export const servicesToDeploy = (
  graph: ServiceGraph,
  changedPackages: readonly string[],
): Set<string> => {
  const traverse = walkGraph(graph, changedPackages)

  return new Set<string>([
    ...traverse((graph, node) => graph.outgoing.adjacent(node)),
    ...traverse((graph, node) => graph.incoming.adjacent(node)),
  ])
}
