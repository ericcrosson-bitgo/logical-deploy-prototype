import Graph, * as graph from '@no-day/fp-ts-graph'
import * as O from 'fp-ts/Option'
import { identity } from 'fp-ts/function'
import * as String from 'fp-ts/string'
import { match } from 'ts-pattern'

import { Child, Digraph, EdgeStatement, NodeStatement } from './Digraph'

type ServiceGraph = Graph<string, string, string>

const insertNode = graph.insertNode(String.Eq)
const insertEdge = graph.insertEdge(String.Eq)

/** Note: only focuses on the main graph (no sub-graphs) */
export const constructGraph = (digraph: Digraph) => {
  let serviceGraph: O.Option<ServiceGraph> = O.some(graph.empty())

  for (const child of digraph[0].children) {
    const reducer = match<
      Child,
      (graph: O.Option<ServiceGraph>) => O.Option<ServiceGraph>
    >(child)
      .when(NodeStatement.is, ({ node_id: { id } }) =>
        O.map(insertNode(id, id)),
      )
      .when(EdgeStatement.is, ({ edge_list: [src, dst]}) =>
        O.chain(insertEdge(src.id, dst.id, 'edge')),
      )
      .otherwise(() => identity)

    serviceGraph = reducer(serviceGraph)
  }

  return serviceGraph
}
