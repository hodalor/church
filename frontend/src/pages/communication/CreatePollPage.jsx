import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import RouteModal from '../../components/ui/RouteModal';
import AudienceSelector from '../../components/communication/AudienceSelector';
import { createPoll } from '../../api/endpoints/communication';
import { useCommunicationAccess } from '../../hooks/useCommunicationAccess';

export default function CreatePollPage() {
  const navigate = useNavigate();
  const { canCreatePolls } = useCommunicationAccess();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([
    { id: 'option-1', text: '' },
    { id: 'option-2', text: '' },
  ]);
  const [audience, setAudience] = useState({ type: 'all_members' });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');

  const createMutation = useMutation({
    mutationFn: (payload) => createPoll(payload),
    onSuccess: () => navigate('/communication/polls'),
  });

  const updateOption = (id, value) => {
    setOptions((current) => current.map((option) => (option.id === id ? { ...option, text: value } : option)));
  };

  return (
    <AppShell>
      <RouteModal
        title="Create Poll"
        description="Create a church poll, define options, and select the audience."
        fallbackPath="/communication/polls"
        size="xl"
      >
        {!canCreatePolls ? (
          <Card>
            <p className="text-sm uppercase tracking-[0.22em] text-accent">Communication</p>
            <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
            <p className="mt-3 text-sm text-white/60">
              Your account does not currently have permission to create polls.
            </p>
          </Card>
        ) : null}
        {canCreatePolls ? <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <Card className="space-y-4">
            <Input label="Question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What day works best for the outreach?" />

            <div className="space-y-3">
              <p className="text-sm font-medium text-white/75">Options</p>
              {options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-3">
                  <span className="text-sm text-white/45">{index + 1}.</span>
                  <input
                    value={option.text}
                    onChange={(event) => updateOption(option.id, event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white"
                    placeholder={`Option ${index + 1}`}
                  />
                  {options.length > 2 ? (
                    <Button variant="ghost" onClick={() => setOptions((current) => current.filter((item) => item.id !== option.id))}>
                      Remove
                    </Button>
                  ) : null}
                </div>
              ))}
              {options.length < 10 ? (
                <Button
                  variant="subtle"
                  onClick={() =>
                    setOptions((current) => [...current, { id: `option-${current.length + 1}`, text: '' }])
                  }
                >
                  Add Option
                </Button>
              ) : null}
            </div>

            <AudienceSelector value={audience} onChange={setAudience} title={question} message={question} channels={['in_app']} />

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <input type="checkbox" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} />
              <span className="text-sm font-medium text-white/75">Anonymous voting</span>
            </label>

            <Input label="Expiry Date" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
          </Card>

          <Card className="space-y-4">
            <p className="text-sm uppercase tracking-[0.22em] text-white/50">Review</p>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">{question || 'Untitled poll'}</p>
              <div className="mt-3 space-y-2">
                {options.map((option) => (
                  <div key={option.id} className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white/70">
                    {option.text || 'Empty option'}
                  </div>
                ))}
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() =>
                createMutation.mutate({
                  question,
                  options: options.filter((option) => option.text.trim()),
                  audience,
                  isAnonymous,
                  expiresAt: expiresAt || undefined,
                })
              }
            >
              Submit Poll
            </Button>
          </Card>
        </div> : null}
      </RouteModal>
    </AppShell>
  );
}
