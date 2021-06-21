import * as t from 'io-ts'

/**
 * Reference: https://github.com/anvaka/dotparser/blob/master/grammar/dot.pegjs
 */

const Attribute = t.type({
  type: t.literal('attr'),
  id: t.string,
  eq: t.union([t.string, t.number]),
})

const AttributeStatement = t.type({
  type: t.literal('attr_stmt'),
  target: t.keyof({
    graph: null,
    node: null,
    edge: null,
  }),
  // NOTE: this is readonlyNonEmptyArray, but it weirded out the t.recursion
  attr_list: t.readonlyArray(Attribute),
})
type AttributeStatement = t.TypeOf<typeof AttributeStatement>

const EdgeStatement = t.type({
  type: t.literal('edge_stmt'),
  edge_list: t.tuple([
    t.type({
      type: t.string,
      id: t.string,
    }),
    t.type({
      type: t.string,
      id: t.string,
    }),
  ]),
  attr_list: t.readonlyArray(Attribute),
})
type EdgeStatement = t.TypeOf<typeof EdgeStatement>

const NodeStatement = t.type({
  type: t.literal('node_stmt'),
  node_id: t.type({
    type: t.literal('node_id'),
    id: t.string,
  }),
  attr_list: t.readonlyArray(Attribute),
})
type NodeStatement = t.TypeOf<typeof NodeStatement>

export interface Subgraph {
  type: 'subgraph'
  id: string
  children: Array<Subgraph | AttributeStatement | EdgeStatement | NodeStatement>
}

const Subgraph: t.Type<Subgraph> = t.type({
  type: t.literal('subgraph'),
  id: t.string,
  children: t.recursion('Subgraph', () => t.readonlyArray(Child)),
})

type Child = AttributeStatement | EdgeStatement | NodeStatement | Subgraph

const Child: t.Type<Child> = t.union([
  AttributeStatement,
  EdgeStatement,
  NodeStatement,
  Subgraph,
])

export const Digraph = t.readonlyArray(
  t.type({
    type: t.literal('digraph'),
    id: t.string,
    children: t.readonlyArray(Child),
  }),
)
