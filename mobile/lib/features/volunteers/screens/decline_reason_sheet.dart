import 'package:flutter/material.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';

class DeclineReasonSheet extends StatefulWidget {
  const DeclineReasonSheet({super.key});

  @override
  State<DeclineReasonSheet> createState() => _DeclineReasonSheetState();
}

class _DeclineReasonSheetState extends State<DeclineReasonSheet> {
  static const List<String> _reasons = <String>['Travel', 'Health', 'Work', 'Family', 'Other'];
  final TextEditingController _notesController = TextEditingController();
  String _selectedReason = _reasons.first;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Center(
              child: Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: AppColors.inputBorder,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Text("Why can't you make it?", style: AppTextStyles.titleMedium),
            const SizedBox(height: 16),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: _reasons
                  .map(
                    (reason) => ChoiceChip(
                      label: Text(reason),
                      selected: _selectedReason == reason,
                      selectedColor: AppColors.accent.withValues(alpha: 0.18),
                      onSelected: (_) => setState(() => _selectedReason = reason),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _notesController,
              maxLines: 4,
              decoration: InputDecoration(
                labelText: 'Notes (optional)',
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
            ),
            const SizedBox(height: 16),
            AppButton(
              label: 'Submit',
              onPressed: () {
                final text = _notesController.text.trim();
                Navigator.of(context).pop(
                  text.isEmpty ? _selectedReason : '$_selectedReason: $text',
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
