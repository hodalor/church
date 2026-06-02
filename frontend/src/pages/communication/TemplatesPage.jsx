import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import {
  createTemplate,
  deleteTemplate,
  getTemplates,
  previewTemplate,
  updateTemplate,
} from '../../api/endpoints/communication';

const emptyForm = {
  name: '',
  category: 'general',
  channels: ['in_app'],
  subject: '',
  body: '',
};

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const templatesQuery = useQuery({
    queryKey: ['communication-templates'],
    queryFn: () => getTemplates(),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => (editingId ? updateTemplate(editingId, payload) : createTemplate(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-templates'] });
      setForm(emptyForm);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communication-templates'] }),
  });

  const previewQuery = useQuery({
    queryKey: ['template-preview', form],
    queryFn: () =>
      previewTemplate({
        subject: form.subject,
        body: form.body,
        variables: {
          firstName: 'Grace',
          lastName: 'Member',
          churchName: 'Prynova Church',
          date: new Date().toLocaleDateString(),
          memberId: 'MEM-000001',
        },
      }),
    enabled: Boolean(form.body),
  });

  const templates = useMemo(() => templatesQuery.data || [], [templatesQuery.data]);

  const toggleChannel = (channel) => {
    setForm((current) => ({
      ...current,
      channels: current.channels.includes(channel)
        ? current.channels.filter((item) => item !== channel)
        : [...current.channels, channel],
    }));
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Templates" action={<Button variant="secondary" onClick={() => setEditingId(null)}>+ New Template</Button>} />

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <Card key={template._id} className="space-y-4 rounded-2xl bg-white/5 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent">{template.category}</Badge>
                  {template.isDefault ? <Badge tone="success">DEFAULT</Badge> : null}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{template.name}</h3>
                  <p className="mt-2 text-sm text-white/60">{template.body?.slice(0, 120)}...</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(template.channels || []).map((channel) => (
                    <Badge key={channel} tone="primary">
                      {channel}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingId(template._id);
                      setForm({
                        name: template.name,
                        category: template.category,
                        channels: template.channels,
                        subject: template.subject || '',
                        body: template.body,
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => setForm({ ...form, subject: template.subject || '', body: template.body })}>
                    Use
                  </Button>
                  {!template.isDefault ? (
                    <Button variant="ghost" onClick={() => deleteMutation.mutate(template._id)}>
                      Delete
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>

          <Card className="space-y-4">
            <p className="text-sm uppercase tracking-[0.22em] text-white/50">{editingId ? 'Edit Template' : 'Create Template'}</p>
            <Input label="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/75">Category</span>
              <select
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white"
              >
                {['welcome', 'birthday', 'follow_up', 'event', 'general', 'alert'].map((category) => (
                  <option key={category} value={category}>
                    {category.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/75">Channels</p>
              <div className="flex flex-wrap gap-2">
                {['sms', 'email', 'whatsapp', 'push', 'in_app'].map((channel) => (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => toggleChannel(channel)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase ${
                      form.channels.includes(channel)
                        ? 'border-accent/40 bg-accent/10 text-accent'
                        : 'border-white/10 bg-white/5 text-white/65'
                    }`}
                  >
                    {channel.replaceAll('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            {form.channels.includes('email') ? (
              <Input label="Subject" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} />
            ) : null}
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/75">Body</span>
              <textarea
                value={form.body}
                onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                rows={8}
                className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white"
              />
            </label>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">Variables</p>
              <div className="mt-3 grid gap-2 text-sm text-white/60">
                <p>{'{{firstName}}'} - Member's first name</p>
                <p>{'{{lastName}}'} - Member's last name</p>
                <p>{'{{churchName}}'} - Your church name</p>
                <p>{'{{date}}'} - Today's date</p>
                <p>{'{{memberId}}'} - Member ID</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">Preview</p>
              <p className="mt-2 text-sm text-white/70">{previewQuery.data?.subject || form.subject}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm text-white/60">{previewQuery.data?.body || form.body}</p>
            </div>
            <Button variant="secondary" className="w-full" onClick={() => saveMutation.mutate(form)}>
              Save Template
            </Button>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
