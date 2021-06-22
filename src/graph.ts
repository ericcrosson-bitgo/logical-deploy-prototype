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

export const servicesToDeploy = (
  graph: ServiceGraph,
  changedPackages: readonly string[],
) => {
  // RESUME: gotta make this recursive
  for (const pkg of changedPackages) {
    console.log('Package', pkg, 'follows ', graph.incoming.adjacent(pkg))
    console.log('Package', pkg, 'leads to', graph.outgoing.adjacent(pkg))
  }
}
