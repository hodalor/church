import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/utils/app_colors.dart';
import '../../../../core/utils/app_text_styles.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/loading_overlay.dart';
import '../providers/prayer_requests_provider.dart';

class SubmitPrayerRequestScreen extends ConsumerStatefulWidget {
  const SubmitPrayerRequestScreen({super.key});

  @override
  ConsumerState<SubmitPrayerRequestScreen> createState() =>
      _SubmitPrayerRequestScreenState();
}

class _SubmitPrayerRequestScreenState
    extends ConsumerState<SubmitPrayerRequestScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  String _category = 'Healing';
  String _urgency = 'normal';
  bool _isAnonymous = false;
  bool _isPublic = false;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LoadingOverlay(
      isLoading: _isSubmitting,
      child: Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          title: Text('Submit Prayer Request', style: AppTextStyles.titleMedium),
        ),
        body: SafeArea(
          child: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: <Widget>[
                TextFormField(
                  controller: _titleController,
                  decoration: const InputDecoration(
                    labelText: 'Title (optional)',
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  initialValue: _category,
                  decoration: const InputDecoration(
                    labelText: 'Category',
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  items: const <String>[
                    'Healing',
                    'Family',
                    'Finances',
                    'Work',
                    'Spiritual Growth',
                    'Relationships',
                    'Other',
                  ].map((item) {
                    return DropdownMenuItem<String>(
                      value: item,
                      child: Text(item),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => _category = value);
                    }
                  },
                ),
                const SizedBox(height: 18),
                Text('Urgency', style: AppTextStyles.titleMedium),
                RadioGroup<String>(
                  groupValue: _urgency,
                  onChanged: (value) {
                    setState(() => _urgency = value ?? 'normal');
                  },
                  child: Column(
                    children: const <Widget>[
                      RadioListTile<String>(
                        value: 'normal',
                        title: Text('Normal'),
                      ),
                      RadioListTile<String>(
                        value: 'urgent',
                        title: Text('Urgent'),
                      ),
                      RadioListTile<String>(
                        value: 'critical',
                        title: Text('Critical'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _descriptionController,
                  minLines: 5,
                  maxLines: 7,
                  maxLength: 500,
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    alignLabelWithHint: true,
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  validator: (value) {
                    final text = value?.trim() ?? '';
                    if (text.length < 10) {
                      return 'Please enter at least 10 characters.';
                    }
                    return null;
                  },
                ),
                SwitchListTile(
                  value: _isAnonymous,
                  activeThumbColor: AppColors.accent,
                  onChanged: (value) => setState(() => _isAnonymous = value),
                  title: const Text('Submit anonymously - your name will be hidden'),
                ),
                SwitchListTile(
                  value: _isPublic,
                  activeThumbColor: AppColors.accent,
                  onChanged: (value) => setState(() => _isPublic = value),
                  title: const Text('Visible to all members (not just pastors)'),
                ),
                const SizedBox(height: 20),
                AppButton(
                  label: 'Submit Prayer Request',
                  onPressed: _submit,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      await ref.read(prayerRequestsProvider.notifier).submitRequest(
        <String, dynamic>{
          'title': _titleController.text.trim(),
          'category': _category,
          'urgency': _urgency,
          'description': _descriptionController.text.trim(),
          'isAnonymous': _isAnonymous,
          'isPublic': _isPublic,
        },
      );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Prayer request submitted 🙏')),
      );
      Navigator.of(context).pop();
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }
}
