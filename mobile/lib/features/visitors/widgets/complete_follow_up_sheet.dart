import 'package:flutter/material.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../visitors_utils.dart';

class CompleteFollowUpSheet extends StatefulWidget {
  const CompleteFollowUpSheet({
    super.key,
    required this.visitorName,
  });

  final String visitorName;

  @override
  State<CompleteFollowUpSheet> createState() => _CompleteFollowUpSheetState();
}

class _CompleteFollowUpSheetState extends State<CompleteFollowUpSheet> {
  final TextEditingController _notesController = TextEditingController();
  String _selectedOutcome = 'spoke';
  bool _scheduleNext = false;
  String _nextMethod = 'call';
  DateTime? _nextDate;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text('Complete Follow-up for ${widget.visitorName}', style: AppTextStyles.titleMedium),
            const SizedBox(height: 18),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: kFollowUpOutcomes.map((outcome) {
                final selected = _selectedOutcome == outcome;
                return ChoiceChip(
                  label: Text(followUpOutcomeLabel(outcome)),
                  selected: selected,
                  onSelected: (_) => setState(() => _selectedOutcome = outcome),
                  selectedColor: AppColors.accent.withValues(alpha: 0.22),
                );
              }).toList(),
            ),
            const SizedBox(height: 18),
            TextField(
              controller: _notesController,
              minLines: 3,
              maxLines: 5,
              decoration: const InputDecoration(
                labelText: 'Notes',
                filled: true,
                fillColor: Colors.white,
              ),
            ),
            const SizedBox(height: 14),
            SwitchListTile.adaptive(
              value: _scheduleNext,
              activeThumbColor: AppColors.accent,
              contentPadding: EdgeInsets.zero,
              title: Text('Schedule Next Follow-up?', style: AppTextStyles.bodyLarge),
              onChanged: (value) => setState(() => _scheduleNext = value),
            ),
            if (_scheduleNext) ...<Widget>[
              const SizedBox(height: 8),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(
                  _nextDate == null ? 'Choose next date' : formatVisitorDate(_nextDate),
                  style: AppTextStyles.bodyLarge,
                ),
                trailing: const Icon(Icons.calendar_month_rounded),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now().add(const Duration(days: 2)),
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (picked != null) {
                    setState(() => _nextDate = picked);
                  }
                },
              ),
              DropdownButtonFormField<String>(
                initialValue: _nextMethod,
                decoration: const InputDecoration(labelText: 'Next method'),
                items: const <String>['call', 'sms', 'whatsapp', 'visit']
                    .map((method) => DropdownMenuItem<String>(
                          value: method,
                          child: Text(method.toUpperCase()),
                        ))
                    .toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _nextMethod = value);
                  }
                },
              ),
            ],
            const SizedBox(height: 20),
            AppButton(
              label: 'Save',
              onPressed: () {
                Navigator.of(context).pop(<String, dynamic>{
                  'outcome': _selectedOutcome,
                  'notes': _notesController.text.trim(),
                  'scheduleNextFollowUp': _scheduleNext,
                  if (_scheduleNext && _nextDate != null) 'nextScheduledDate': _nextDate!.toIso8601String(),
                  if (_scheduleNext) 'nextMethod': _nextMethod,
                });
              },
            ),
          ],
        ),
      ),
    );
  }
}
