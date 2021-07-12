# Logical Deploys Prototype

> Prototype for calculating packages to deploy for logical deploys initiative

```typescript
/**
 * The idea:
 *
 * 1. [X] dot -> service ast
 * 2. [X] traverse service ast -> set of stacks necessary to stand up
 * 3. [ ] export stacks as helm chart(?)
 */
```

## Install

```shell
npm install
```

## Use

```shell
Usage:
  index <package>...

Options:
  <package>    Name of modified package
```

## Acknowledgments

- [dotparser](https://www.npmjs.com/package/dotparser)
