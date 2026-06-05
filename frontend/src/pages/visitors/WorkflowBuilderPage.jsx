import { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { useMutation, useQuery } from '@tanstack/react-query';
import AppShell from '../../components/layout/AppShell';
import WorkflowStepCard from '../../components/visitors/WorkflowStepCard';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import {
  getVisitorWorkflow,
  saveVisitorWorkflow,
  testVisitorWorkflow,
} from '../../api/endpoints/visitors';
import useVisitorsAccess from '../../hooks/useVisitorsAccess';

const createStep = (index) => ({
  id: `step-${Date.now()}-${index}`,
  name: `Workflow Step ${index + 1}`,
  day: index,
  actions: [],
});

const createAction = () => ({
  id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type: 'send_message',
  channel: 'sms',
  template: '',
  preview: '',
});

export default function WorkflowBuilderPage() {
  const { canOpenWorkflow, canModifyWorkflow } = useVisitorsAccess();
  const [steps, setSteps] = useState([]);
  const [isActive, setIsActive] = useState(true);

  const workflowQuery = useQuery({
    queryKey: ['visitor-workflow'],
    queryFn: getVisitorWorkflow,
  });

  const saveMutation = useMutation({
    mutationFn: () => saveVisitorWorkflow(steps),
  });

  const testMutation = useMutation({
    mutationFn: () => testVisitorWorkflow(steps),
  });

  useEffect(() => {
    if (workflowQuery.data) {
      setSteps(workflowQuery.data);
    }
  }, [workflowQuery.data]);

  const onDragEnd = (result) => {
    if (!canModifyWorkflow) {
      return;
    }

    if (!result.destination) {
      return;
    }

    const next = [...steps];
    const [removed] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, removed);
    setSteps(next);
  };

  if (!canOpenWorkflow) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Visitors</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have access to the visitor workflow builder.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">Visitors</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Assimilation Workflow</h1>
            <p className="mt-2 text-sm text-white/55">
              Configure automatic follow-up actions triggered by days since first visit.
            </p>
          </div>
          <label className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
            <span>Workflow Active</span>
            <input
              type="checkbox"
              checked={isActive}
              disabled={!canModifyWorkflow}
              onChange={(event) => setIsActive(event.target.checked)}
            />
          </label>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="workflow-steps">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                    {steps.map((step, index) => (
                      <Draggable draggableId={step.id} index={index} key={step.id}>
                        {(draggableProvided) => (
                          <div ref={draggableProvided.innerRef} {...draggableProvided.draggableProps}>
                            <WorkflowStepCard
                              step={step}
                              index={index}
                              dragHandleProps={draggableProvided.dragHandleProps}
                              onChange={(nextStep) =>
                                setSteps((current) => current.map((item) => (item.id === nextStep.id ? nextStep : item)))
                              }
                              onAddAction={(stepId) =>
                                setSteps((current) =>
                                  current.map((item) =>
                                    item.id === stepId
                                      ? { ...item, actions: [...item.actions, createAction()] }
                                      : item,
                                  ),
                                )
                              }
                              onRemoveAction={(stepId, actionId) =>
                                setSteps((current) =>
                                  current.map((item) =>
                                    item.id === stepId
                                      ? { ...item, actions: item.actions.filter((action) => action.id !== actionId) }
                                      : item,
                                  ),
                                )
                              }
                              onRemoveStep={(stepId) =>
                                setSteps((current) => current.filter((item) => item.id !== stepId))
                              }
                              readOnly={!canModifyWorkflow}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <Button
              variant="subtle"
              onClick={() => setSteps((current) => [...current, createStep(current.length)])}
              disabled={!canModifyWorkflow}
            >
              + Add Step
            </Button>
          </div>

          <div className="space-y-4">
            <Card className="sticky top-24 space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-accent/80">Preview</p>
                <h2 className="mt-2 text-xl font-semibold text-white">What happens when a new visitor registers</h2>
              </div>
              <div className="space-y-3">
                {steps.map((step) => (
                  <div key={step.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">{step.name}</p>
                      <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                        Day {step.day}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-white/55">
                      {(step.actions || []).length
                        ? step.actions.map((action) => action.type.replaceAll('_', ' ')).join(', ')
                        : 'No actions yet'}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <Card className="sticky bottom-4 flex flex-wrap items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending || !canModifyWorkflow}
          >
            {testMutation.isPending ? 'Testing...' : 'Test Workflow'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !canModifyWorkflow}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Workflow'}
          </Button>
        </Card>

        {testMutation.data?.length ? (
          <Card className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Dry Run Preview</h3>
            {testMutation.data.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="font-semibold text-white">
                  Day {item.day} • {item.name}
                </p>
                <p className="mt-1 text-sm text-white/60">{item.actionsSummary}</p>
              </div>
            ))}
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
