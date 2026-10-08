---
"@sdcorejs/utils": patch
---

Add `StringUtilities.mask` and the exported `StringMaskOptions` interface for display masking with optional `keepStart`, `keepEnd`, and `maskLength`.

The helper preserves grapheme clusters when keeping characters and uses a fixed number of `*` characters (four by default), independent of the number of hidden characters. Keeps that cover a nonempty input return only the mask. Empty strings stay empty, while `null` and `undefined` pass through without inspecting options. For example, `mask('0912345678', { keepStart: 3, keepEnd: 2 })` returns `'091****78'`.

Keep counts must be nonnegative safe integers, and `maskLength` must be an integer from 1 through 1024. Positive keeps on nonempty strings require `Intl.Segmenter`; unsupported runtimes reject those calls with `ValidationError`. Invalid runtime inputs or options also reject with `ValidationError`. The helper does not trim, coerce, mutate, encrypt, or automatically sanitize logs or JSON.

Include API examples, runtime support documentation, Unicode and boundary tests, and packed ESM/CommonJS consumer checks.
