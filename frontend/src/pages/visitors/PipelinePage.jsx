import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppShell from '../../components/layout/AppShell';
import ConversionModal from '../../components/visitors/ConversionModal';
import VisitorCard from '../../components/visitors/VisitorCard';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import {
  convertVisitorToMember,
  getVisitorAssignableLeaders,
  getVisitorPipeline,
  updateVisitorStage,
} from '../../api/endpoints/visitors';
import useVisitorsAccess from '../../hooks/useVisitorsAccess';
import { getStageMeta } from '../../utils/visitors';

const filterInputClass =
  'w-full rounded-[16px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.1),rgba(16,24,39,0.98))] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/40';

export default function PipelinePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canOpenPipeline, canMoveVisitors, canConvertVisitors, canOpenFollowUps, canOpenRegister } =
    useVisitorsAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const [board, setBoard] = useState([]);
  const [convertingVisitor, setConvertingVisitor] = useState(null);
  const filters = {
    branch: searchParams.get('branch') || 'all',
    assignedTo: searchParams.get('assignedTo') || 'all',
    fromDate: searchParams.get('fromDate') || '',
    toDate: searchParams.get('toDate') || '',
  };

  const pipelineQuery = useQuery({
    queryKey: ['visitor-pipeline', filters],
    queryFn: () => getVisitorPipeline(filters),
  });

  const leadersQuery = useQuery({
    queryKey: ['visitor-pipeline-leaders'],
    queryFn: getVisitorAssignableLeaders,
  });

  useEffect(() => {
    setBoard(pipelineQuery.data?.stages || []);
  }, [pipelineQuery.data]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['visitor-pipeline'] });
    queryClient.invalidateQueries({ queryKey: ['visitors-list'] });
    queryClient.invalidateQueries({ queryKey: ['visitor-detail'] });
    queryClient.invalidateQueries({ queryKey: ['visitor-reports'] });
  };

  const stageMutation = useMutation({
    mutationFn: ({ visitorId, stage }) => updateVisitorStage(visitorId, stage),
    onError: () => {
      setBoard(pipelineQuery.data?.stages || []);
    },
    onSuccess: refresh,
  });

  const convertMutation = useMutation({
    mutationFn: ({ visitorId, payload }) => convertVisitorToMember(visitorId, payload),
    onSuccess: () => {
      setConvertingVisitor(null);
      refresh();
    },
  });

  const branchOptions = useMemo(() => {
    const values = new Set();
    (pipelineQuery.data?.stages || []).forEach((stage) =>
      (stage.items || []).forEach((visitor) => {
        if (visitor.branch) {
          values.add(visitor.branch);
        }
      }),
    );
    return [...values];
  }, [pipelineQuery.data]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const onDragEnd = (result) => {
    if (!canMoveVisitors) {
      return;
    }

    const { destination, source } = result;
    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId
      && destination.index === source.index
    ) {
      return;
    }

    const nextBoard = [...board];
    const sourceColumn = nextBoard.find((column) => column.stage === source.droppableId);
    const destinationColumn = nextBoard.find((column) => column.stage === destination.droppableId);
    if (!sourceColumn || !destinationColumn) {
      return;
    }

    const [movedVisitor] = sourceColumn.items.splice(source.index, 1);
    destinationColumn.items.splice(destination.index, 0, {
      ...movedVisitor,
      stage: destination.droppableId,
    });
    setBoard(nextBoard.map((column) => ({ ...column })));

    if (movedVisitor.stage !== destination.droppableId) {
      stageMutation.mutate({
        visitorId: movedVisitor.id,
        stage: destination.droppableId,
      });
    }
  };

  if (!canOpenPipeline) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Visitors</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have access to the visitor pipeline.
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
            <h1 className="mt-2 text-2xl font-semibold text-white">Pipeline Board</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => navigate(`/visitors?${searchParams.toString()}`)}>
              List View
            </Button>
            {canOpenRegister ? (
              <Link to="/visitors/register">
                <Button variant="secondary">+ Register Visitor</Button>
              </Link>
            ) : null}
          </div>
        </div>

        <Card className="space-y-4 border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(13,19,32,0.98))]">
          <div className="grid gap-3 lg:grid-cols-4">
            <FilterSelect
              label="Branch"
              value={filters.branch}
              onChange={(value) => updateParam('branch', value)}
              options={[{ value: 'all', label: 'All Branches' }, ...branchOptions.map((branch) => ({ value: branch, label: branch }))]}
            />
            <FilterSelect
              label="Assigned To"
              value={filters.assignedTo}
              onChange={(value) => updateParam('assignedTo', value)}
              options={[{ value: 'all', label: 'All Leaders' }, ...(leadersQuery.data || []).map((leader) => ({ value: leader.id, label: leader.name }))]}
            />
            <InputDate label="From" value={filters.fromDate} onChange={(value) => updateParam('fromDate', value)} />
            <InputDate label="To" value={filters.toDate} onChange={(value) => updateParam('toDate', value)} />
          </div>
        </Card>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-3">
            {board.map((column) => {
              const meta = getStageMeta(column.stage);
              return (
                <Droppable droppableId={column.stage} key={column.stage}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[500px] w-[312px] shrink-0 rounded-[22px] border p-3.5 shadow-[0_14px_30px_rgba(0,0,0,0.14)] ${meta.columnClassName}`}
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{column.label}</p>
                          <p className="text-xs text-white/45">{column.items.length} visitors</p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
                          {column.items.length}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {column.items.map((visitor, index) => (
                          <Draggable draggableId={visitor.id} index={index} key={visitor.id}>
                            {(draggableProvided) => (
                              <div
                                ref={draggableProvided.innerRef}
                                {...draggableProvided.draggableProps}
                              >
                                <VisitorCard
                                  visitor={visitor}
                                  dragHandleProps={canMoveVisitors ? draggableProvided.dragHandleProps : {}}
                                  onView={() => navigate(`/visitors/${visitor.id}`)}
                                  onCompleteFollowUp={() => navigate(`/visitors/follow-ups?visitorId=${visitor.id}`)}
                                  onConvert={() => setConvertingVisitor(visitor)}
                                  canDrag={canMoveVisitors}
                                  canOpenFollowUp={canOpenFollowUps}
                                  canConvert={canConvertVisitors}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {canConvertVisitors ? (
        <ConversionModal
          isOpen={Boolean(convertingVisitor)}
          visitor={convertingVisitor}
          onClose={() => setConvertingVisitor(null)}
          isLoading={convertMutation.isPending}
          onConvert={(payload) =>
            convertMutation.mutate({
              visitorId: convertingVisitor.id,
              payload,
            })
          }
        />
      ) : null}
    </AppShell>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-medium text-white/75">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={filterInputClass}
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function InputDate({ label, value, onChange }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-medium text-white/75">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={filterInputClass}
      />
    </label>
  );
}
