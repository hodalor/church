import 'package:flutter/material.dart';
import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../visitors_utils.dart';

class StageSelectorSheet extends StatefulWidget {
  const StageSelectorSheet({
    super.key,
    required this.currentStage,
  });

  final String currentStage;

  @override
  State<StageSelectorSheet> createState() => _StageSelectorSheetState();
}

class _StageSelectorSheetState extends State<StageSelectorSheet> {
  late String _selectedStage = widget.currentStage;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text('Update Pipeline Stage', style: AppTextStyles.titleMedium),
          const SizedBox(height: 18),
          ...kVisitorStages.map((stage) {
            final selected = stage == _selectedStage;
            final color = stageColorFor(stage);
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: InkWell(
                onTap: () => setState(() => _selectedStage = stage),
                borderRadius: BorderRadius.circular(18),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: selected ? color.withValues(alpha: 0.12) : Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: selected ? color : AppColors.inputBorder,
                    ),
                  ),
                  child: Row(
                    children: <Widget>[
                      Icon(
                        selected ? Icons.check_circle_rounded : Icons.circle_outlined,
                        color: color,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        stageLabel(stage),
                        style: AppTextStyles.bodyLarge.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
          const SizedBox(height: 8),
          AppButton(
            label: 'Confirm Stage',
            onPressed: () => Navigator.of(context).pop(_selectedStage),
          ),
        ],
      ),
    );
  }
}
