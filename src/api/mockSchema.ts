import type { SchemaModel } from '../types/schema';

export const mockSchemaModels: SchemaModel[] = [
  {
    name: 'Book',
    appLabel: 'library',
    tableName: 'library_book',
    rowEstimate: 12480,
    fields: [
      { name: 'id', type: 'AutoField', kind: 'number', primaryKey: true, indexed: true, sampleValues: [1, 2, 3] },
      { name: 'title', type: 'CharField', kind: 'string', indexed: true, sampleValues: ['Django Patterns', 'Graph Databases'] },
      { name: 'published_at', type: 'DateField', kind: 'date', nullable: true, sampleValues: ['2021-04-12'] },
      { name: 'author', type: 'ForeignKey', kind: 'relation', relatedModel: 'Author', relationType: 'many-to-one' },
      { name: 'tags', type: 'ManyToManyField', kind: 'relation', relatedModel: 'Tag', relationType: 'many-to-many' },
    ],
  },
  {
    name: 'Author',
    appLabel: 'library',
    tableName: 'library_author',
    rowEstimate: 932,
    fields: [
      { name: 'id', type: 'AutoField', kind: 'number', primaryKey: true, indexed: true },
      { name: 'name', type: 'CharField', kind: 'string', indexed: true, sampleValues: ['Ada Lovelace'] },
      { name: 'country', type: 'CharField', kind: 'string', nullable: true },
    ],
  },
  {
    name: 'Tag',
    appLabel: 'library',
    tableName: 'library_tag',
    rowEstimate: 78,
    fields: [
      { name: 'id', type: 'AutoField', kind: 'number', primaryKey: true, indexed: true },
      { name: 'name', type: 'SlugField', kind: 'string', unique: true, sampleValues: ['django', 'orm'] },
    ],
  },
];
