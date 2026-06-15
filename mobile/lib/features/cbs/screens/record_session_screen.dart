import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/services/connectivity_service.dart';
import '../../../../core/utils/app_colors.dart';
import '../../../../shared/widgets/app_button.dart';
import '../data/models/cbs_prospect.dart';
import '../providers/cbs_provider.dart';

class RecordSessionScreen extends ConsumerStatefulWidget {
  const RecordSessionScreen({
    super.key,
    required this.groupId,
  });

  final String groupId;

  @override
  ConsumerState<RecordSessionScreen> createState() => _RecordSessionScreenState();
}

class _RecordSessionScreenState extends ConsumerState<RecordSessionScreen> {
  final TextEditingController _topicController = TextEditingController();
  final TextEditingController _referenceController = TextEditingController();
  final TextEditingController _durationController = TextEditingController(text: '60');
  final TextEditingController _venueController = TextEditingController();
  final TextEditingController _observationsController = TextEditingController();
  final TextEditingController _nextTopicController = TextEditingController();
  final List<_DecisionDraft> _decisions = <_DecisionDraft>[];
  final Set<String> _selectedProspectIds = <String>{};
  int _guestCount = 0;
  DateTime _selectedDate = DateTime.now();
  DateTime? _nextSessionDate;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(cbsProvider.notifier).loadProspects(widget.groupId);
    });
  }

  @override
  void dispose() {
    _topicController.dispose();
    _referenceController.dispose();
    _durationController.dispose();
    _venueController.dispose();
    _observationsController.dispose();
    _nextTopicController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final prospects = ref.watch(cbsProvider).prospects;
    final isOnline = ref.watch(connectivityProvider).isOnline;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(title: const Text('Record CBS Session')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: <Widget>[
          if (!isOnline)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF3CD),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE0B14A)),
              ),
              child: const Text(
                'Offline — session will sync when online',
                style: TextStyle(
                  color: Color(0xFF8A6D1A),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          TextField(
            controller: _topicController,
            decoration: const InputDecoration(labelText: 'Topic*'),
          ),
          const SizedBox(height: 12),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Date*'),
            subtitle: Text(MaterialLocalizations.of(context).formatFullDate(_selectedDate)),
            trailing: const Icon(Icons.calendar_month_rounded),
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                firstDate: DateTime.now().subtract(const Duration(days: 365)),
                lastDate: DateTime.now().add(const Duration(days: 365)),
                initialDate: _selectedDate,
              );
              if (picked != null) {
                setState(() {
                  _selectedDate = picked;
                });
              }
            },
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _referenceController,
            decoration: const InputDecoration(labelText: 'Scripture reference'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _durationController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Duration'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _venueController,
            decoration: const InputDecoration(labelText: 'Venue'),
          ),
          const SizedBox(height: 18),
          Row(
            children: <Widget>[
              Text('Attendees', style: Theme.of(context).textTheme.titleMedium),
              const Spacer(),
              TextButton(
                onPressed: () {
                  setState(() {
                    _selectedProspectIds
                      ..clear()
                      ..addAll(prospects.map((item) => item.prospectId));
                  });
                },
                child: const Text('Select All'),
              ),
              TextButton(
                onPressed: () {
                  setState(() {
                    _guestCount++;
                  });
                },
                child: const Text('+ Add Guest'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...prospects.map((prospect) => CheckboxListTile(
                value: _selectedProspectIds.contains(prospect.prospectId),
                activeColor: AppColors.primary,
                title: Text(prospect.fullName),
                subtitle: Text(prospect.stageLabel),
                onChanged: (_) {
                  setState(() {
                    if (_selectedProspectIds.contains(prospect.prospectId)) {
                      _selectedProspectIds.remove(prospect.prospectId);
                    } else {
                      _selectedProspectIds.add(prospect.prospectId);
                    }
                  });
                },
              )),
          if (_guestCount > 0)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text('Guest attendees: $_guestCount'),
            ),
          const SizedBox(height: 18),
          Row(
            children: <Widget>[
              Text('Decisions', style: Theme.of(context).textTheme.titleMedium),
              const Spacer(),
              TextButton.icon(
                onPressed: () {
                  setState(() {
                    _decisions.add(_DecisionDraft());
                  });
                },
                icon: const Icon(Icons.add_circle_outline_rounded),
                label: const Text('Add Decision'),
              ),
            ],
          ),
          ..._decisions.asMap().entries.map((entry) {
            final index = entry.key;
            final decision = entry.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.inputBorder),
              ),
              child: Column(
                children: <Widget>[
                  DropdownButtonFormField<String>(
                    value: decision.prospectId,
                    items: prospects
                        .map((item) => DropdownMenuItem<String>(
                              value: item.prospectId,
                              child: Text(item.fullName),
                            ))
                        .toList(),
                    onChanged: (value) => setState(() => decision.prospectId = value),
                    decoration: const InputDecoration(labelText: 'Prospect'),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: decision.type,
                    items: const <DropdownMenuItem<String>>[
                      DropdownMenuItem(value: 'accepted_christ', child: Text('Accepted Christ')),
                      DropdownMenuItem(value: 'baptism_request', child: Text('Baptism Request')),
                      DropdownMenuItem(value: 'prayer_request', child: Text('Prayer Request')),
                    ],
                    onChanged: (value) => setState(() => decision.type = value),
                    decoration: const InputDecoration(labelText: 'Decision type'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    onChanged: (value) => decision.notes = value,
                    decoration: const InputDecoration(labelText: 'Notes'),
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: 12),
          TextField(
            controller: _observationsController,
            maxLines: 4,
            decoration: const InputDecoration(labelText: 'Observations'),
          ),
          const SizedBox(height: 12),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Next session date'),
            subtitle: Text(
              _nextSessionDate == null
                  ? 'Not set'
                  : MaterialLocalizations.of(context).formatFullDate(_nextSessionDate!),
            ),
            trailing: const Icon(Icons.schedule_rounded),
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                firstDate: DateTime.now(),
                lastDate: DateTime.now().add(const Duration(days: 365)),
                initialDate: _nextSessionDate ?? DateTime.now(),
              );
              if (picked != null) {
                setState(() {
                  _nextSessionDate = picked;
                });
              }
            },
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _nextTopicController,
            decoration: const InputDecoration(labelText: 'Next session topic'),
          ),
          const SizedBox(height: 20),
          AppButton(
            label: !isOnline ? 'Save Session (Pending Sync)' : 'Save Session',
            isLoading: _isSaving,
            onPressed: () async {
              setState(() {
                _isSaving = true;
              });
              final payload = _buildPayload(prospects);
              await ref.read(cbsProvider.notifier).recordSession(widget.groupId, payload);
              if (!mounted) {
                return;
              }
              setState(() {
                _isSaving = false;
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    isOnline
                        ? 'CBS session saved successfully.'
                        : 'CBS session saved. Pending sync.',
                  ),
                ),
              );
              Navigator.of(context).pop();
            },
          ),
        ],
      ),
    );
  }

  Map<String, dynamic> _buildPayload(List<CBSProspect> prospects) {
    final selectedProspects = prospects.where((item) => _selectedProspectIds.contains(item.prospectId)).toList();
    final attendees = selectedProspects
        .map(
          (prospect) => <String, dynamic>{
            'prospectId': prospect.prospectId,
            'prospectName': prospect.fullName,
            'isFirstTime': prospect.studiesAttended == 0,
          },
        )
        .toList();

    for (var i = 0; i < _guestCount; i++) {
      attendees.add(
        <String, dynamic>{
          'prospectName': 'Guest ${i + 1}',
          'isFirstTime': true,
        },
      );
    }

    final outcomes = _decisions
        .where((item) => (item.type ?? '').isNotEmpty)
        .map((item) => '${item.type}:${item.prospectId ?? 'guest'}:${item.notes ?? ''}')
        .toList();

    return <String, dynamic>{
      'date': _selectedDate.toIso8601String(),
      'studyTopic': _topicController.text.trim(),
      'studyReference': _referenceController.text.trim(),
      'duration': int.tryParse(_durationController.text.trim()) ?? 60,
      'venue': _venueController.text.trim(),
      'attendees': attendees,
      'outcomes': outcomes,
      'leaderNotes': _observationsController.text.trim(),
      if (_nextSessionDate != null) 'nextSessionDate': _nextSessionDate!.toIso8601String(),
      if (_nextTopicController.text.trim().isNotEmpty) 'curriculum': _nextTopicController.text.trim(),
      'guestsCount': _guestCount,
    };
  }
}

class _DecisionDraft {
  String? prospectId;
  String? type;
  String? notes;
}
