import { GripVertical, Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { FOLLOW_UP_METHOD_OPTIONS, WORKFLOW_ACTION_TYPES } from '../../utils/visitors';

export default function WorkflowStepCard({
  step,
  index,
  dragHandleProps = {},
  onChange,
  onAddAction,
  onRemoveAction,
  onRemoveStep,
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-[#0d1320] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/55" {...dragHandleProps}>
            <GripVertical className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Step {index + 1}</p>
            <input
              value={step.name}
              onChange={(event) => onChange({ ...step, name: event.target.value })}
              className="mt-1 w-full bg-transparent text-lg font-semibold text-white outline-none"
            />
          </div>
        </div>
        <Button variant="ghost" onClick={() => onRemoveStep(step.id)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Remove Step
        </Button>
      </div>

      <Input
        label="Trigger: Day X after first visit"
        type="number"
        value={step.day}
        onChange={(event) => onChange({ ...step, day: Number(event.target.value || 0) })}
      />

      <div className="space-y-3">
        {(step.actions || []).map((action) => (
          <div key={action.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/75">Action Type</span>
              <select
                value={action.type}
                onChange={(event) =>
                  onChange({
                    ...step,
                    actions: step.actions.map((item) =>
                      item.id === action.id ? { ...item, type: event.target.value } : item,
                    ),
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none"
              >
                {WORKFLOW_ACTION_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>

            {action.type === 'send_message' ? (
              <>
                <Input
                  label="Channel"
                  value={action.channel || ''}
                  onChange={(event) =>
                    onChange({
                      ...step,
                      actions: step.actions.map((item) =>
                        item.id === action.id ? { ...item, channel: event.target.value } : item,
                      ),
                    })
                  }
                />
                <Input
                  label="Template"
                  value={action.template || ''}
                  onChange={(event) =>
                    onChange({
                      ...step,
                      actions: step.actions.map((item) =>
                        item.id === action.id ? { ...item, template: event.target.value } : item,
                      ),
                    })
                  }
                />
                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-white/75">Message Preview</span>
                  <textarea
                    rows={3}
                    value={action.preview || ''}
                    onChange={(event) =>
                      onChange({
                        ...step,
                        actions: step.actions.map((item) =>
                          item.id === action.id ? { ...item, preview: event.target.value } : item,
                        ),
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
              </>
            ) : null}

            {action.type === 'create_follow_up' ? (
              <>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/75">Method</span>
                  <select
                    value={action.method || ''}
                    onChange={(event) =>
                      onChange({
                        ...step,
                        actions: step.actions.map((item) =>
                          item.id === action.id ? { ...item, method: event.target.value } : item,
                        ),
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none"
                  >
                    {FOLLOW_UP_METHOD_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Input
                  label="Note Template"
                  value={action.noteTemplate || ''}
                  onChange={(event) =>
                    onChange({
                      ...step,
                      actions: step.actions.map((item) =>
                        item.id === action.id ? { ...item, noteTemplate: event.target.value } : item,
                      ),
                    })
                  }
                />
              </>
            ) : null}

            {action.type === 'notify_care_leader' ? (
              <>
                <Input
                  label="Urgency"
                  value={action.urgency || ''}
                  onChange={(event) =>
                    onChange({
                      ...step,
                      actions: step.actions.map((item) =>
                        item.id === action.id ? { ...item, urgency: event.target.value } : item,
                      ),
                    })
                  }
                />
                <Input
                  label="Message"
                  value={action.message || ''}
                  onChange={(event) =>
                    onChange({
                      ...step,
                      actions: step.actions.map((item) =>
                        item.id === action.id ? { ...item, message: event.target.value } : item,
                      ),
                    })
                  }
                />
              </>
            ) : null}

            {action.type === 'auto_assign_leader' ? (
              <Input
                label="Role Selector"
                value={action.role || ''}
                onChange={(event) =>
                  onChange({
                    ...step,
                    actions: step.actions.map((item) =>
                      item.id === action.id ? { ...item, role: event.target.value } : item,
                    ),
                  })
                }
              />
            ) : null}

            {action.type === 'send_survey' ? (
              <Input
                label="Channel"
                value={action.channel || ''}
                onChange={(event) =>
                  onChange({
                    ...step,
                    actions: step.actions.map((item) =>
                      item.id === action.id ? { ...item, channel: event.target.value } : item,
                    ),
                  })
                }
              />
            ) : null}

            <div className="md:col-span-2">
              <Button variant="ghost" onClick={() => onRemoveAction(step.id, action.id)}>
                Remove Action
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button variant="subtle" onClick={() => onAddAction(step.id)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Action
      </Button>
    </div>
  );
}
