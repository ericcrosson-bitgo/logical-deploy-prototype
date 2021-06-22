import * as fs from 'fs'

import * as Console from 'fp-ts/Console'
import * as E from 'fp-ts/Either'
import * as IO from 'fp-ts/IO'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import { pipe, flow, Endomorphism, identity } from 'fp-ts/function'
import * as t from 'io-ts'
import { decodeDocopt } from 'io-ts-docopt'
import { withEncode, readonlyNonEmptyArray } from 'io-ts-types'
import * as PathReporter from 'io-ts/lib/PathReporter'

import { Digraph } from './Digraph'
import { constructGraph, servicesToDeploy } from './graph'

const dotparser = require('dotparser')

const DOT_SOURCE = './logical_network_diagram.dot'

/**
 * The idea:
 *
 * 1. [X] dot -> service ast
 * 2. [X] traverse service ast -> set of stacks necessary to stand up
 * 3. [ ] export stacks as helm chart(?)
 */

const docstring = `
Usage:
  index <package>...

Options:
  <package>    Name of modified package
`
// FIXME: `name` is ambiguous in the above docstring

const CommandLineOptions = withEncode(
  t.type({
    '<package>': readonlyNonEmptyArray(t.string),
  }),
  (_) => ({
    packages: _['<package>'],
  }),
)

type Err =
  | { type: 'invalid CLI arguments'; error: string }
  | { type: 'unable to read file'; file: string; error: NodeJS.ErrnoException }
  | { type: 'unable to create dot AST'; error: unknown }
  | { type: 'unexpected dot AST'; error: string }

const err: Endomorphism<Err> = identity

const docopt = () =>
  pipe(
    decodeDocopt(CommandLineOptions, docstring),
    E.mapLeft(
      flow(
        (errors) => PathReporter.failure(errors).join('\n'),
        (error) => err({ type: 'invalid CLI arguments', error }),
      ),
    ),
  )

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
  TE.Do,
  TE.bind('options', TE.fromEitherK(docopt)),
  TE.bind('ast', () =>
    pipe(
      readFile(DOT_SOURCE),
      TE.chainEitherK(parseDotProgram),
      TE.chainEitherK(parseDotAst),
      TE.map(constructGraph),
    ),
  ),
  TE.map(({ options: { packages }, ast }) =>
    Array.from(servicesToDeploy(ast, packages)),
  ),
  TE.fold(
    flow(
      Console.error,
      IO.chain(() => exit(1)),
      T.fromIO,
    ),
    flow(Console.log, T.fromIO),
  ),
)

main()
