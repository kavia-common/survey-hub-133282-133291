import React from 'react';

/**
 * PUBLIC_INTERFACE
 * SchemaPreview
 * A visual, Tailwind-styled reference of the database schema for developers/designers.
 * This is a static preview; no backend integration.
 */
export default function SchemaPreview() {
  const tables = [
    {
      name: 'users',
      pk: ['id'],
      fields: [
        { name: 'id', type: 'UUID', notes: 'PK, default gen_random_uuid()' },
        { name: 'name', type: 'TEXT', notes: 'NOT NULL' },
        { name: 'email', type: 'TEXT', notes: 'UNIQUE, NOT NULL' },
        { name: 'created_at', type: 'TIMESTAMPTZ', notes: 'DEFAULT now()' },
      ],
      relations: [],
    },
    {
      name: 'surveys',
      pk: ['id'],
      fields: [
        { name: 'id', type: 'UUID', notes: 'PK, default gen_random_uuid()' },
        { name: 'title', type: 'TEXT', notes: 'NOT NULL' },
        { name: 'description', type: 'TEXT', notes: 'NULLABLE' },
        { name: 'created_by', type: 'UUID', notes: 'FK -> users.id, ON DELETE CASCADE' },
        { name: 'is_active', type: 'BOOLEAN', notes: 'DEFAULT true' },
        { name: 'created_at', type: 'TIMESTAMPTZ', notes: 'DEFAULT now()' },
      ],
      relations: [
        { from: 'created_by', to: 'users.id', type: 'many-to-one' },
      ],
    },
    {
      name: 'questions',
      pk: ['id'],
      fields: [
        { name: 'id', type: 'UUID', notes: 'PK, default gen_random_uuid()' },
        { name: 'survey_id', type: 'UUID', notes: 'FK -> surveys.id, ON DELETE CASCADE' },
        { name: 'question_text', type: 'TEXT', notes: 'NOT NULL' },
        { name: 'question_type', type: 'ENUM', notes: "('text','multiple_choice','single_choice','rating')" },
        { name: 'required', type: 'BOOLEAN', notes: 'DEFAULT false' },
        { name: 'position', type: 'INT', notes: 'DEFAULT 0' },
        { name: 'created_at', type: 'TIMESTAMPTZ', notes: 'DEFAULT now()' },
      ],
      relations: [
        { from: 'survey_id', to: 'surveys.id', type: 'many-to-one' },
      ],
    },
    {
      name: 'options',
      pk: ['id'],
      fields: [
        { name: 'id', type: 'UUID', notes: 'PK, default gen_random_uuid()' },
        { name: 'question_id', type: 'UUID', notes: 'FK -> questions.id, ON DELETE CASCADE' },
        { name: 'option_text', type: 'TEXT', notes: 'NOT NULL' },
        { name: 'position', type: 'INT', notes: 'DEFAULT 0' },
      ],
      relations: [
        { from: 'question_id', to: 'questions.id', type: 'many-to-one' },
      ],
    },
    {
      name: 'responses',
      pk: ['id'],
      fields: [
        { name: 'id', type: 'UUID', notes: 'PK, default gen_random_uuid()' },
        { name: 'survey_id', type: 'UUID', notes: 'FK -> surveys.id, ON DELETE CASCADE' },
        { name: 'user_id', type: 'UUID', notes: 'FK -> users.id, ON DELETE SET NULL' },
        { name: 'submitted_at', type: 'TIMESTAMPTZ', notes: 'DEFAULT now()' },
      ],
      relations: [
        { from: 'survey_id', to: 'surveys.id', type: 'many-to-one' },
        { from: 'user_id', to: 'users.id', type: 'many-to-one (nullable)' },
      ],
    },
    {
      name: 'answers',
      pk: ['id'],
      fields: [
        { name: 'id', type: 'UUID', notes: 'PK, default gen_random_uuid()' },
        { name: 'response_id', type: 'UUID', notes: 'FK -> responses.id, ON DELETE CASCADE' },
        { name: 'question_id', type: 'UUID', notes: 'FK -> questions.id, ON DELETE CASCADE' },
        { name: 'option_id', type: 'UUID', notes: 'FK -> options.id, ON DELETE SET NULL, NULLABLE' },
        { name: 'answer_text', type: 'TEXT', notes: 'NULLABLE' },
        { name: 'created_at', type: 'TIMESTAMPTZ', notes: 'DEFAULT now()' },
      ],
      relations: [
        { from: 'response_id', to: 'responses.id', type: 'many-to-one' },
        { from: 'question_id', to: 'questions.id', type: 'many-to-one' },
        { from: 'option_id', to: 'options.id', type: 'many-to-one (nullable)' },
      ],
      constraints: [
        'CHECK: answer_text IS NOT NULL OR option_id IS NOT NULL',
      ]
    },
  ];

  const rels = [
    { from: 'surveys.created_by', to: 'users.id' },
    { from: 'questions.survey_id', to: 'surveys.id' },
    { from: 'options.question_id', to: 'questions.id' },
    { from: 'responses.survey_id', to: 'surveys.id' },
    { from: 'responses.user_id', to: 'users.id' },
    { from: 'answers.response_id', to: 'responses.id' },
    { from: 'answers.question_id', to: 'questions.id' },
    { from: 'answers.option_id', to: 'options.id' },
  ];

  return (
    <div className="container">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <span className="badge badge-primary">Schema Preview</span>
          <span className="badge badge-slate">PostgreSQL + UUID</span>
        </div>
        <h1 className="h1">Survey Data Model</h1>
        <p className="muted">
          Static visual reference of tables, fields, types, and relationships. No backend calls are made.
        </p>
      </header>

      <section className="card mb-4">
        <h2 className="h2">Relationships</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {rels.map((r, idx) => (
            <div key={idx} className="p-2 rounded bg-slate-800 small">
              <span className="tag">{r.from}</span>
              <span className="muted"> → </span>
              <span className="tag">{r.to}</span>
            </div>
          ))}
        </div>
        <p className="footer-note">All primary keys use UUID with default gen_random_uuid().</p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {tables.map((t) => (
          <article key={t.name} className="card">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="h2">{t.name}</h3>
              <span className="badge badge-green">table</span>
            </div>
            <table className="table small">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {t.fields.map((f) => (
                  <tr key={`${t.name}-${f.name}`}>
                    <td className="text-slate-100">{f.name}</td>
                    <td className="text-slate-300">{f.type}</td>
                    <td className="text-slate-400">{f.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {t.pk?.length ? (
              <>
                <div className="mt-4 small">
                  <span className="badge badge-amber">Primary Key</span>
                </div>
                <ul className="list small mt-2">
                  {t.pk.map((p) => <li key={p}><span className="code">{p}</span></li>)}
                </ul>
              </>
            ) : null}

            {t.relations?.length ? (
              <>
                <div className="mt-4 small">
                  <span className="badge badge-primary">Foreign Keys</span>
                </div>
                <ul className="list small mt-2">
                  {t.relations.map((rel, idx) => (
                    <li key={`${t.name}-rel-${idx}`}>
                      <span className="code">{rel.from}</span>
                      <span className="muted"> → </span>
                      <span className="code">{rel.to}</span>
                      {rel.type ? <span className="muted"> ({rel.type})</span> : null}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {t.constraints?.length ? (
              <>
                <div className="mt-4 small">
                  <span className="badge badge-slate">Constraints</span>
                </div>
                <ul className="list small mt-2">
                  {t.constraints.map((c, idx) => <li key={`${t.name}-c-${idx}`}>{c}</li>)}
                </ul>
              </>
            ) : null}
          </article>
        ))}
      </section>

      <hr className="hr" />

      <section className="card">
        <h2 className="h2">Notes</h2>
        <ul className="list small">
          <li>Ensure pgcrypto extension is enabled for gen_random_uuid().</li>
          <li>Use server-side constraints to maintain integrity; frontend should respect required, types, and positions.</li>
          <li>answers.answer_text or answers.option_id must be provided depending on question type.</li>
          <li>responses.user_id is optional to accommodate anonymous submissions.</li>
        </ul>
      </section>
    </div>
  );
}
