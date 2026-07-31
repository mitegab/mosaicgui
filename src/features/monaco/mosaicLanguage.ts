import type * as Monaco from 'monaco-editor';

const DSL_OPERATORS = [
  'exact', 'contains', 'icontains', 'gt', 'gte', 'lt', 'lte', 'in', 'isnull',
] as const;

const OPERATOR_DOCS: Record<string, string> = {
  exact:     'Exact equality match  (SQL: =)',
  contains:  'Contains substring — case-sensitive  (SQL: LIKE %x%)',
  icontains: 'Contains substring — case-insensitive  (SQL: ILIKE %x%)',
  gt:        'Greater than  (SQL: >)',
  gte:       'Greater than or equal  (SQL: >=)',
  lt:        'Less than  (SQL: <)',
  lte:       'Less than or equal  (SQL: <=)',
  in:        'Value is in a list  (SQL: IN (…))',
  isnull:    'Is null / not null  (SQL: IS NULL / IS NOT NULL)',
};

const DSL_KEYS = [
  'model', 'filters', 'relations', 'output', 'limit', 'offset', 'orderBy',
  'groups', 'field', 'operator', 'value', 'logic', 'from', 'to',
];

type MonacoType = typeof Monaco;

/** Registers schema-aware autocomplete for the Mosaic JSON DSL. */
export function registerMosaicDsl(
  monaco: MonacoType,
  modelNames: string[],
  fieldNamesByModel: Record<string, string[]>,
) {
  // ── Completion provider ──────────────────────────────────────────────
  monaco.languages.registerCompletionItemProvider('json', {
    triggerCharacters: ['"', ':', ' '],
    provideCompletionItems(model, position) {
      const text = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: position.column,
        endColumn: position.column,
      };

      const suggestions: Monaco.languages.CompletionItem[] = [];

      // model names
      if (/"model"\s*:\s*"[^"]*$/.test(text)) {
        modelNames.forEach((name) =>
          suggestions.push({
            label: name,
            kind: monaco.languages.CompletionItemKind.Class,
            documentation: `Query the **${name}** model`,
            insertText: name,
            range,
          }),
        );
      }

      // operators
      if (/"operator"\s*:\s*"[^"]*$/.test(text)) {
        DSL_OPERATORS.forEach((op) =>
          suggestions.push({
            label: op,
            kind: monaco.languages.CompletionItemKind.EnumMember,
            detail: OPERATOR_DOCS[op],
            insertText: op,
            range,
          }),
        );
      }

      // logic values
      if (/"logic"\s*:\s*"[^"]*$/.test(text)) {
        ['AND', 'OR'].forEach((v) =>
          suggestions.push({
            label: v,
            kind: monaco.languages.CompletionItemKind.EnumMember,
            insertText: v,
            range,
          }),
        );
      }

      // field names — include all known fields from every model
      if (/"field"\s*:\s*"[^"]*$/.test(text)) {
        const allFields = [...new Set(Object.values(fieldNamesByModel).flat())];
        allFields.forEach((field) =>
          suggestions.push({
            label: field,
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: field,
            range,
          }),
        );
      }

      // top-level DSL keys
      if (/"[^"]*$/.test(text) && !/"(model|operator|logic|field|from|to)"/.test(text)) {
        DSL_KEYS.forEach((key) =>
          suggestions.push({
            label: key,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: key,
            range,
          }),
        );
      }

      return { suggestions };
    },
  });

  // ── Hover provider ────────────────────────────────────────────────────
  monaco.languages.registerHoverProvider('json', {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;
      const token = word.word;

      if (DSL_OPERATORS.includes(token as (typeof DSL_OPERATORS)[number])) {
        return {
          contents: [
            { value: `**Operator: \`${token}\`**` },
            { value: OPERATOR_DOCS[token] ?? token },
          ],
        };
      }

      if (modelNames.includes(token)) {
        const fields = fieldNamesByModel[token] ?? [];
        return {
          contents: [
            { value: `**Model: \`${token}\`**` },
            { value: `Fields: \`${fields.join('`, `') || '—'}\`` },
          ],
        };
      }

      const fieldOwner = Object.entries(fieldNamesByModel).find(([, fields]) =>
        fields.includes(token),
      );
      if (fieldOwner) {
        return {
          contents: [
            { value: `**Field: \`${token}\`**` },
            { value: `Belongs to \`${fieldOwner[0]}\`` },
          ],
        };
      }

      return null;
    },
  });
}

/** Registers a code-folding provider for JSON arrays and objects. */
export function registerFoldingProvider(monaco: MonacoType) {
  monaco.languages.registerFoldingRangeProvider('json', {
    provideFoldingRanges(model) {
      const ranges: Monaco.languages.FoldingRange[] = [];
      const lines = model.getLinesContent();
      const stack: number[] = [];
      lines.forEach((line, i) => {
        const t = line.trim();
        if (t.endsWith('[') || t.endsWith('{') || t.endsWith('[,') || t.endsWith('{,'))
          stack.push(i + 1);
        else if (t === ']' || t === '],' || t === '}' || t === '},') {
          const start = stack.pop();
          if (start !== undefined && i + 1 > start)
            ranges.push({ start, end: i + 1 });
        }
      });
      return ranges;
    },
  });
}
