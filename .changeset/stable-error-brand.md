---
"@sdcorejs/utils": patch
---

Keep `instanceof` and `name` of every library error stable when an application bundles the package.

Each public entry point (`@sdcorejs/utils`, `/fns`, `/errors`, ...) ships its own copy of the
error classes. Cross-entry `instanceof` relied on a brand that stored `constructor.name`. Application
bundlers hoist modules into one scope and rename duplicated class bindings: esbuild produces
`UnsafePropertyPathError2` even without minification, and minifiers produce short names. In a
bundled app, `error instanceof UnsafePropertyPathError` from `@sdcorejs/utils/errors` therefore
returned `false` for an error thrown by `@sdcorejs/utils/fns`, and `error.name` read as the renamed
binding. This also broke checks such as `instanceof FilePickerCancelledError` in consumers.

Every error class now declares a public `static readonly errorName` string equal to its export name.
`error.name` and the cross-entry brand use that value, and `Symbol.hasInstance` still tries the native
prototype check first. Messages, `cause` and fields such as `path`, `key`, `protocol` and
`valueType` are unchanged. Package validation now bundles the package with esbuild, with minify off
and on, and asserts cross-entry `instanceof` and `name`.

**Breaking for custom subclasses.** A class that extends any `@sdcorejs/utils` error must declare
its own `errorName`, otherwise its constructor throws
`TypeError: <ClassName> must declare its own static errorName`. Add one line to each subclass:

```ts
class OrderSyncError extends ValidationError {
  static override readonly errorName: string = 'OrderSyncError';
}
```

This ships as a patch because the library has few external consumers; review custom subclasses
before upgrading. Use a single `@sdcorejs/utils` version per application bundle, since brands created
by older copies stored constructor names.
