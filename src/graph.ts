import Graph, * as graph from '@no-day/fp-ts-graph'
import * as O from 'fp-ts/Option'
import { identity } from 'fp-ts/function'
import * as String from 'fp-ts/string'
import { match } from 'ts-pattern'

import {
  Child,
  Digraph,
  Subgraph,
  EdgeStatement,
  NodeStatement,
} from './Digraph'

type ServiceGraph = Graph<string, string, string>

const insertNode = graph.insertNode(String.Eq)
const insertEdge = graph.insertEdge(String.Eq)

const constructGraphWorker = (
  serviceGraph: O.Option<ServiceGraph>,
  children: ReadonlyArray<Child>,
): O.Option<ServiceGraph> => {
  for (const child of children) {
    const reducer = match<
      Child,
      (graph: O.Option<ServiceGraph>) => O.Option<ServiceGraph>
    >(child)
      .when(NodeStatement.is, ({ node_id: { id } }) =>
        O.map(insertNode(id, id)),
      )
      .when(EdgeStatement.is, ({ edge_list: [{ id: a }, { id: b }] }) =>
        O.chain(insertEdge(a, b, 'edge')),
      )
      .when(Subgraph.is, ({ children }) =>
        graph => constructGraphWorker(graph, children)
      )
      .otherwise(() => identity)

    serviceGraph = reducer(serviceGraph)
  }

  return serviceGraph
}

export const constructGraph = (digraph: Digraph) => {
  const serviceGraph: O.Option<ServiceGraph> = O.some(graph.empty())
  return constructGraphWorker(serviceGraph, digraph[0].children)
}
