import * as fs from 'fs'

import * as Console from 'fp-ts/Console'
import * as E from 'fp-ts/Either'
import * as IO from 'fp-ts/IO'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import { pipe, flow, Endomorphism, identity } from 'fp-ts/function'
import * as PathReporter from 'io-ts/lib/PathReporter'

import { Digraph } from './Digraph'
import { constructGraph } from './graph'

const dotparser = require('dotparser')

/**
 * The idea:
 *
 * 1. [X] dot -> service ast
 * 2. [ ] service ast -> stacks necessary to stand up
 * 3. [ ] export stacks as helm chart(?)
 */

type Err =
  | { type: 'unable to read file'; file: string; error: NodeJS.ErrnoException }
  | { type: 'unable to create dot AST'; error: unknown }
  | { type: 'unexpected dot AST'; error: string }

const err: Endomorphism<Err> = identity

export const readFile = (file: string) =>
  pipe(
    file,
    TE.taskify(fs.readFile),
    TE.bimap(
      (error) => err({ type: 'unable to read file', file, error }),
      (buffer) => buffer.toString(),
    ),
  )

const parseDotProgram = (source: string) =>
  E.tryCatch(
    () => dotparser(source),
    (error) => err({ type: 'unable to create dot AST', error }),
  )

const parseDotAst = flow(
  Digraph.decode.bind(null),
  E.mapLeft(
    flow(
      (errors) => PathReporter.failure(errors).join('\n'),
      (error) => err({ type: 'unexpected dot AST', error }),
    ),
  ),
)

const exit = (code: 0 | 1) => () => process.exit(code)

const main: T.Task<void> = pipe(
  './logical_network_diagram.dot',
  readFile,
  TE.chainEitherK(parseDotProgram),
  TE.chainEitherK(parseDotAst),
  TE.map(constructGraph),
  TE.map((graph) => console.log(graph)),
  TE.getOrElseW(
    flow(
      Console.error,
      IO.chain(() => exit(1)),
      T.fromIO,
    ),
  ),
)

main()
