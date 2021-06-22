import * as t from 'io-ts'
import { readonlyNonEmptyArray } from 'io-ts-types'

/*
 * Reference:
 * https://github.com/anvaka/dotparser/blob/master/grammar/dot.pegjs
 */

const Attribute = t.type({
  type: t.literal('attr'),
  id: t.string,
  eq: t.union([t.string, t.number]),
})

export const AttributeStatement = t.type({
  type: t.literal('attr_stmt'),
  target: t.keyof({
    graph: null,
    node: null,
    edge: null,
  }),
  // NOTE: this is readonlyNonEmptyArray, but it weirded out the t.recursion
  attr_list: t.readonlyArray(Attribute),
})
export type AttributeStatement = t.TypeOf<typeof AttributeStatement>

const NodeID = t.type({
  type: t.literal('node_id'),
  id: t.string,
})

export const EdgeStatement = t.type({
  type: t.literal('edge_stmt'),
  edge_list: t.tuple([NodeID, NodeID]),
  attr_list: t.readonlyArray(Attribute),
})
export type EdgeStatement = t.TypeOf<typeof EdgeStatement>

export const NodeStatement = t.type({
  type: t.literal('node_stmt'),
  node_id: NodeID,
  attr_list: t.readonlyArray(Attribute),
})
export type NodeStatement = t.TypeOf<typeof NodeStatement>

export interface Subgraph {
  type: 'subgraph'
  id: string
  children: Array<Subgraph | AttributeStatement | EdgeStatement | NodeStatement>
}

export const Subgraph: t.Type<Subgraph> = t.type({
  type: t.literal('subgraph'),
  id: t.string,
  children: t.recursion('Subgraph', () => t.readonlyArray(Child)),
})

export type Child = AttributeStatement | EdgeStatement | NodeStatement | Subgraph

const Child: t.Type<Child> = t.union([
  AttributeStatement,
  EdgeStatement,
  NodeStatement,
  Subgraph,
])

export const Digraph = readonlyNonEmptyArray(
  t.type({
    type: t.literal('digraph'),
    id: t.string,
    children: t.readonlyArray(Child),
  }),
)
export type Digraph = t.TypeOf<typeof Digraph>
