import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/models/visitor.dart';
import '../providers/visitors_provider.dart';
import '../visitors_utils.dart';
import '../widgets/follow_up_timeline_tile.dart';
import '../widgets/stage_selector_sheet.dart';

class VisitorDetailScreen extends ConsumerStatefulWidget {
  const VisitorDetailScreen({
    super.key,
    required this.visitorId,
  });

  final String visitorId;

  @override
  ConsumerState<VisitorDetailScreen> createState() => _VisitorDetailScreenState();
}

class _VisitorDetailScreenState extends ConsumerState<VisitorDetailScreen> {
  Visitor? _visitor;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadVisitor();
  }

  Future<void> _loadVisitor() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final repository = ref.read(visitorRepositoryProvider);
      final visitor = await repository.getVisitorById(widget.visitorId);
      if (!mounted) {
        return;
      }
      setState(() {
        _visitor = visitor;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final role = ref.watch(authProvider).user?.role;
    if (!isVisitorLeaderRole(role)) {
      return Scaffold(
        appBar: AppBar(title: Text('Visitor Detail', style: AppTextStyles.titleMedium)),
        body: Center(
          child: Text('Care leader access only.', style: AppTextStyles.bodyLarge),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Text(_visitor?.fullName ?? 'Visitor Detail', style: AppTextStyles.titleMedium),
        actions: <Widget>[
          if (_visitor != null)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(child: _StageBadge(stage: _visitor!.pipelineStage)),
            ),
        ],
      ),
      floatingActionButton: _visitor == null
          ? null
          : FloatingActionButton.extended(
              onPressed: _showAddFollowUpDialog,
              backgroundColor: AppColors.accent,
              foregroundColor: AppColors.primary,
              icon: const Icon(Icons.add_task_rounded),
              label: const Text('Add Follow-up'),
            ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null || _visitor == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(_error ?? 'Visitor not found.', style: AppTextStyles.bodyLarge),
        ),
      );
    }

    final visitor = _visitor!;
    final followUps = visitor.followUps;

    return RefreshIndicator(
      onRefresh: _loadVisitor,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
        children: <Widget>[
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.inputBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Row(
                  children: <Widget>[
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: visitor.stageColor.withValues(alpha: 0.14),
                      child: Text(
                        visitor.initials,
                        style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w700),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(visitor.fullName, style: AppTextStyles.headlineMedium),
                          const SizedBox(height: 4),
                          Text(visitor.visitorId, style: AppTextStyles.bodyMedium),
                        ],
                      ),
                    ),
                    _StageBadge(stage: visitor.pipelineStage),
                  ],
                ),
                const SizedBox(height: 18),
                _ActionRow(
                  label: visitor.phone ?? 'No phone',
                  icon: Icons.call_outlined,
                  onTap: visitor.phone == null ? null : () => _launchUri('tel:${visitor.phone}'),
                ),
                const SizedBox(height: 8),
                _ActionRow(
                  label: visitor.email ?? 'No email',
                  icon: Icons.email_outlined,
                  onTap: visitor.email == null ? null : () => _launchUri('mailto:${visitor.email}'),
                ),
                const SizedBox(height: 14),
                Text(
                  'First visit: ${formatVisitorDate(visitor.firstVisitDate)}  •  Total visits: ${visitor.totalVisits}',
                  style: AppTextStyles.bodyMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  'Assigned care leader: ${visitor.assignedToName ?? 'Unassigned'}',
                  style: AppTextStyles.bodyMedium,
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          Row(
            children: <Widget>[
              Expanded(
                child: OutlinedButton(
                  onPressed: _showReturnVisitDialog,
                  child: const Text('Record Return Visit'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: _showConvertDialog,
                  style: FilledButton.styleFrom(backgroundColor: AppColors.accent),
                  child: const Text('Convert to Member'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: _showStageSelector,
              child: const Text('Change Stage'),
            ),
          ),
          const SizedBox(height: 22),
          Text('Follow-up Timeline', style: AppTextStyles.titleMedium),
          const SizedBox(height: 12),
          if (followUps.isEmpty)
            Text('No follow-ups yet.', style: AppTextStyles.bodyMedium)
          else
            ...followUps.asMap().entries.map((entry) {
              return FollowUpTimelineTile(
                followUp: entry.value,
                isLast: entry.key == followUps.length - 1,
              );
            }),
          const SizedBox(height: 22),
          Text('Visit History', style: AppTextStyles.titleMedium),
          const SizedBox(height: 12),
          ...visitor.visits.map((visit) => Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.inputBorder),
                ),
                child: Text(
                  '${formatVisitorDate(DateTime.tryParse((visit['date'] ?? '').toString()))} • ${(visit['serviceName'] ?? 'Church Service').toString()}',
                  style: AppTextStyles.bodyLarge,
                ),
              )),
          const SizedBox(height: 22),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.inputBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('Interests & Notes', style: AppTextStyles.titleMedium),
                const SizedBox(height: 12),
                if (visitor.interests.isNotEmpty)
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: visitor.interests
                        .map((interest) => Chip(label: Text(interest)))
                        .toList(),
                  ),
                if (visitor.interests.isNotEmpty) const SizedBox(height: 12),
                Text(visitor.notes ?? 'No notes available.', style: AppTextStyles.bodyMedium),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showStageSelector() async {
    if (_visitor == null) return;
    final stage = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (_) => StageSelectorSheet(currentStage: _visitor!.pipelineStage),
    );

    if (stage == null || stage == _visitor!.pipelineStage) {
      return;
    }

    final visitor = await ref.read(visitorRepositoryProvider).updatePipelineStage(_visitor!.id, stage);
    await ref.read(visitorsProvider.notifier).replaceVisitor(visitor);
    setState(() => _visitor = visitor);
  }

  Future<void> _showConvertDialog() async {
    if (_visitor == null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Convert to Member'),
        content: Text('This will create a member profile for ${_visitor!.fullName}.'),
        actions: <Widget>[
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: FilledButton.styleFrom(backgroundColor: AppColors.accent),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );

    if (confirmed != true) {
      return;
    }

    final payload = await ref.read(visitorRepositoryProvider).convertToMember(_visitor!.id, <String, dynamic>{
      'firstName': _visitor!.firstName,
      'lastName': _visitor!.lastName,
      'phone': _visitor!.phone,
      'email': _visitor!.email,
      'gender': _visitor!.gender,
      'branch': _visitor!.branch,
    });
    final updatedVisitor = Visitor.fromJson(payload);
    await ref.read(visitorsProvider.notifier).replaceVisitor(updatedVisitor);
    setState(() => _visitor = updatedVisitor);
  }

  Future<void> _showReturnVisitDialog() async {
    if (_visitor == null) return;
    final serviceController = TextEditingController();
    final notesController = TextEditingController();
    DateTime selectedDate = DateTime.now();

    final shouldSave = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Record Return Visit'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              TextField(
                controller: serviceController,
                decoration: const InputDecoration(labelText: 'Service name'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: notesController,
                decoration: const InputDecoration(labelText: 'Notes'),
              ),
              const SizedBox(height: 12),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(formatVisitorDate(selectedDate)),
                trailing: const Icon(Icons.calendar_month_rounded),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: selectedDate,
                    firstDate: DateTime.now().subtract(const Duration(days: 365)),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (picked != null) {
                    setState(() => selectedDate = picked);
                  }
                },
              ),
            ],
          ),
          actions: <Widget>[
            TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: FilledButton.styleFrom(backgroundColor: AppColors.accent),
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );

    if (shouldSave != true) {
      return;
    }

    final visitor = await ref.read(visitorRepositoryProvider).recordReturnVisit(_visitor!.id, <String, dynamic>{
      'serviceName': serviceController.text.trim(),
      'notes': notesController.text.trim(),
      'date': selectedDate.toIso8601String(),
    });
    await ref.read(visitorsProvider.notifier).replaceVisitor(visitor);
    setState(() => _visitor = visitor);
  }

  Future<void> _showAddFollowUpDialog() async {
    if (_visitor == null) return;
    final notesController = TextEditingController();
    DateTime selectedDate = DateTime.now().add(const Duration(days: 1));
    String method = 'call';

    final shouldSave = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Add Follow-up'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              DropdownButtonFormField<String>(
                initialValue: method,
                items: const <String>['call', 'sms', 'whatsapp', 'visit']
                    .map((value) => DropdownMenuItem<String>(value: value, child: Text(value.toUpperCase())))
                    .toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() => method = value);
                  }
                },
              ),
              const SizedBox(height: 10),
              TextField(
                controller: notesController,
                decoration: const InputDecoration(labelText: 'Notes'),
              ),
              const SizedBox(height: 12),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(formatVisitorDate(selectedDate)),
                trailing: const Icon(Icons.calendar_month_rounded),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: selectedDate,
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (picked != null) {
                    setState(() => selectedDate = picked);
                  }
                },
              ),
            ],
          ),
          actions: <Widget>[
            TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: FilledButton.styleFrom(backgroundColor: AppColors.accent),
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );

    if (shouldSave != true) {
      return;
    }

    final visitor = await ref.read(visitorRepositoryProvider).createFollowUp(_visitor!.id, <String, dynamic>{
      'method': method,
      'notes': notesController.text.trim(),
      'scheduledDate': selectedDate.toIso8601String(),
    });
    await ref.read(visitorsProvider.notifier).replaceVisitor(visitor);
    setState(() => _visitor = visitor);
  }

  Future<void> _launchUri(String value) async {
    final uri = Uri.parse(value);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }
}

class _ActionRow extends StatelessWidget {
  const _ActionRow({
    required this.label,
    required this.icon,
    this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Row(
        children: <Widget>[
          Icon(icon, color: AppColors.primary),
          const SizedBox(width: 10),
          Expanded(child: Text(label, style: AppTextStyles.bodyLarge)),
        ],
      ),
    );
  }
}

class _StageBadge extends StatelessWidget {
  const _StageBadge({required this.stage});

  final String stage;

  @override
  Widget build(BuildContext context) {
    final color = stageColorFor(stage);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        stageLabel(stage),
        style: AppTextStyles.bodyMedium.copyWith(
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
