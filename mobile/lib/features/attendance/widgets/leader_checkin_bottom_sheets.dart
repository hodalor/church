import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/app_colors.dart';
import '../../../core/utils/app_text_styles.dart';
import '../../../shared/widgets/app_button.dart';
import '../../members/data/models/member.dart';
import '../../members/providers/members_provider.dart';
import '../../members/widgets/member_avatar.dart';
import '../providers/attendance_provider.dart';

Future<Map<String, dynamic>?> showManualCheckInSheet(
  BuildContext context, {
  required String serviceId,
}) {
  return showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _SheetScaffold(
      child: _ManualCheckInSheet(serviceId: serviceId),
    ),
  );
}

Future<Map<String, dynamic>?> showVisitorCheckInSheet(
  BuildContext context, {
  required String serviceId,
}) {
  return showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _SheetScaffold(
      child: _VisitorCheckInSheet(serviceId: serviceId),
    ),
  );
}

Future<Map<String, dynamic>?> showChildCheckInSheet(
  BuildContext context, {
  required String serviceId,
}) {
  return showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _SheetScaffold(
      child: _ChildCheckInSheet(serviceId: serviceId),
    ),
  );
}

class _SheetScaffold extends StatelessWidget {
  const _SheetScaffold({
    required this.child,
  });

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
        child: SafeArea(top: false, child: child),
      ),
    );
  }
}

class _ManualCheckInSheet extends ConsumerStatefulWidget {
  const _ManualCheckInSheet({
    required this.serviceId,
  });

  final String serviceId;

  @override
  ConsumerState<_ManualCheckInSheet> createState() => _ManualCheckInSheetState();
}

class _ManualCheckInSheetState extends ConsumerState<_ManualCheckInSheet> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  Timer? _debounce;
  List<Member> _results = const <Member>[];
  bool _isSearching = false;
  bool _isSubmitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _focusNode.requestFocus());
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _searchMembers(String query) async {
    if (query.trim().length < 2) {
      setState(() {
        _results = const <Member>[];
        _isSearching = false;
        _error = null;
      });
      return;
    }

    setState(() {
      _isSearching = true;
      _error = null;
    });

    try {
      final response = await ref.read(memberRepositoryProvider).getMembers(
            limit: 10,
            search: query.trim(),
          );
      if (!mounted) {
        return;
      }
      setState(() {
        _results = response.members;
        _isSearching = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _isSearching = false;
        _error = error.toString();
      });
    }
  }

  Future<void> _submit(Member member) async {
    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final payload = await ref.read(attendanceRepositoryProvider).manualCheckIn(
            member.memberId,
            widget.serviceId,
          );
      if (!mounted) {
        return;
      }
      Navigator.of(context).pop(<String, dynamic>{
        ...payload,
        'memberName': member.fullName,
        'photoUrl': member.photoUrl,
        'memberId': member.memberId,
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _isSubmitting = false;
        _error = error.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.72,
      child: Column(
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
          const SizedBox(height: 16),
          Text('Manual Check-in', style: AppTextStyles.titleMedium),
          const SizedBox(height: 6),
          Text(
            'Search by member name, member ID, or phone number.',
            style: AppTextStyles.bodyMedium,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _searchController,
            focusNode: _focusNode,
            decoration: const InputDecoration(
              hintText: 'Search member',
              prefixIcon: Icon(Icons.search_rounded),
            ),
            onChanged: (value) {
              _debounce?.cancel();
              _debounce = Timer(
                const Duration(milliseconds: 350),
                () => _searchMembers(value),
              );
            },
          ),
          if (_error != null) ...<Widget>[
            const SizedBox(height: 10),
            Text(
              _error!,
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.danger),
            ),
          ],
          const SizedBox(height: 14),
          Expanded(
            child: _isSearching
                ? const Center(child: CircularProgressIndicator())
                : _results.isEmpty
                    ? Center(
                        child: Text(
                          _searchController.text.trim().length < 2
                              ? 'Start typing to search.'
                              : 'No members found.',
                          style: AppTextStyles.bodyMedium,
                        ),
                      )
                    : ListView.builder(
                        itemCount: _results.length,
                        itemBuilder: (context, index) {
                          final member = _results[index];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(color: AppColors.inputBorder),
                            ),
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 6,
                              ),
                              leading: MemberAvatar(
                                photoUrl: member.photoUrl,
                                firstName: member.firstName,
                                lastName: member.lastName,
                              ),
                              title: Text(member.fullName),
                              subtitle: Text(
                                '${member.memberId}${member.department.isNotEmpty ? ' • ${member.department.first}' : ''}',
                              ),
                              trailing: _isSubmitting
                                  ? const SizedBox(
                                      width: 22,
                                      height: 22,
                                      child: CircularProgressIndicator(strokeWidth: 2.2),
                                    )
                                  : const Icon(Icons.arrow_forward_ios_rounded, size: 18),
                              onTap: _isSubmitting ? null : () => _submit(member),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

class _VisitorCheckInSheet extends ConsumerStatefulWidget {
  const _VisitorCheckInSheet({
    required this.serviceId,
  });

  final String serviceId;

  @override
  ConsumerState<_VisitorCheckInSheet> createState() => _VisitorCheckInSheetState();
}

class _VisitorCheckInSheetState extends ConsumerState<_VisitorCheckInSheet> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  bool _firstTimer = false;
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final payload = await ref.read(attendanceRepositoryProvider).visitorCheckIn(
            <String, dynamic>{
              'serviceId': widget.serviceId,
              'name': _nameController.text.trim(),
              'phone': _phoneController.text.trim(),
              'email': _emailController.text.trim(),
              'firstTimer': _firstTimer,
            },
          );
      if (!mounted) {
        return;
      }
      Navigator.of(context).pop(<String, dynamic>{
        ...payload,
        'memberName': _nameController.text.trim(),
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _isSubmitting = false;
        _error = error.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Form(
        key: _formKey,
        child: Column(
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
            const SizedBox(height: 16),
            Text('Visitor Check-in', style: AppTextStyles.titleMedium),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Visitor Name'),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Enter visitor name';
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phoneController,
              decoration: const InputDecoration(labelText: 'Phone'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: 'Email'),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 10),
            SwitchListTile.adaptive(
              value: _firstTimer,
              activeThumbColor: AppColors.accent,
              activeTrackColor: AppColors.accent.withValues(alpha: 0.35),
              title: Text(
                'First Timer',
                style: AppTextStyles.bodyLarge.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                ),
              ),
              onChanged: (value) => setState(() => _firstTimer = value),
            ),
            if (_error != null) ...<Widget>[
              const SizedBox(height: 8),
              Text(
                _error!,
                style: AppTextStyles.bodyMedium.copyWith(color: AppColors.danger),
              ),
            ],
            const SizedBox(height: 12),
            AppButton(
              label: 'Check In Visitor',
              onPressed: _submit,
              isLoading: _isSubmitting,
            ),
          ],
        ),
      ),
    );
  }
}

class _ChildCheckInSheet extends ConsumerStatefulWidget {
  const _ChildCheckInSheet({
    required this.serviceId,
  });

  final String serviceId;

  @override
  ConsumerState<_ChildCheckInSheet> createState() => _ChildCheckInSheetState();
}

class _ChildCheckInSheetState extends ConsumerState<_ChildCheckInSheet> {
  final TextEditingController _parentController = TextEditingController();
  final TextEditingController _childNameController = TextEditingController();
  final FocusNode _parentFocusNode = FocusNode();
  Timer? _debounce;
  List<Member> _parentResults = const <Member>[];
  Member? _selectedParent;
  bool _isSearching = false;
  bool _isSubmitting = false;
  int _age = 5;
  String? _error;

  @override
  void dispose() {
    _debounce?.cancel();
    _parentController.dispose();
    _childNameController.dispose();
    _parentFocusNode.dispose();
    super.dispose();
  }

  Future<void> _searchParents(String query) async {
    if (query.trim().length < 2) {
      setState(() {
        _parentResults = const <Member>[];
        _isSearching = false;
        _error = null;
      });
      return;
    }

    setState(() {
      _isSearching = true;
      _error = null;
    });

    try {
      final response = await ref.read(memberRepositoryProvider).getMembers(
            limit: 10,
            search: query.trim(),
          );
      if (!mounted) {
        return;
      }
      setState(() {
        _parentResults = response.members;
        _isSearching = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _isSearching = false;
        _error = error.toString();
      });
    }
  }

  Future<void> _submit() async {
    final navigator = Navigator.of(context);

    if (_selectedParent == null) {
      setState(() {
        _error = 'Select the parent member first.';
      });
      return;
    }
    if (_childNameController.text.trim().isEmpty) {
      setState(() {
        _error = 'Enter child name.';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    try {
      final payload = await ref.read(attendanceRepositoryProvider).childCheckIn(
            <String, dynamic>{
              'serviceId': widget.serviceId,
              'parentMemberId': _selectedParent!.memberId,
              'childName': _childNameController.text.trim(),
              'age': _age,
            },
          );
      if (!mounted) {
        return;
      }

      final pickupCode =
          (payload['pickupCode'] ?? payload['code'] ?? '').toString();
      if (pickupCode.isNotEmpty) {
        await Clipboard.setData(ClipboardData(text: pickupCode));
      }

      navigator.pop(<String, dynamic>{
        ...payload,
        'memberName': _childNameController.text.trim(),
        'pickupCode': pickupCode,
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _isSubmitting = false;
        _error = error.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.78,
      child: Column(
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
          const SizedBox(height: 16),
          Text('Child Check-in', style: AppTextStyles.titleMedium),
          const SizedBox(height: 12),
          TextField(
            controller: _parentController,
            focusNode: _parentFocusNode,
            decoration: const InputDecoration(
              labelText: 'Parent Member',
              prefixIcon: Icon(Icons.search_rounded),
            ),
            onChanged: (value) {
              _selectedParent = null;
              _debounce?.cancel();
              _debounce = Timer(
                const Duration(milliseconds: 350),
                () => _searchParents(value),
              );
            },
          ),
          if (_selectedParent != null) ...<Widget>[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: <Widget>[
                  MemberAvatar(
                    photoUrl: _selectedParent!.photoUrl,
                    firstName: _selectedParent!.firstName,
                    lastName: _selectedParent!.lastName,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _selectedParent!.fullName,
                      style: AppTextStyles.bodyLarge.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: () => setState(() => _selectedParent = null),
                    child: const Text('Change'),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 12),
          TextField(
            controller: _childNameController,
            decoration: const InputDecoration(labelText: 'Child Name'),
          ),
          const SizedBox(height: 14),
          Row(
            children: <Widget>[
              Text(
                'Child Age',
                style: AppTextStyles.bodyLarge.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              IconButton(
                onPressed: () => setState(() => _age = _age > 1 ? _age - 1 : 1),
                icon: const Icon(Icons.remove_circle_outline_rounded),
              ),
              Text('$_age', style: AppTextStyles.titleMedium),
              IconButton(
                onPressed: () => setState(() => _age++),
                icon: const Icon(Icons.add_circle_outline_rounded),
              ),
            ],
          ),
          if (_error != null) ...<Widget>[
            const SizedBox(height: 8),
            Text(
              _error!,
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.danger),
            ),
          ],
          const SizedBox(height: 10),
          AppButton(
            label: 'Check In Child',
            onPressed: _submit,
            isLoading: _isSubmitting,
          ),
          const SizedBox(height: 12),
          Expanded(
            child: _isSearching
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    itemCount: _parentResults.length,
                    itemBuilder: (context, index) {
                      final parent = _parentResults[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: AppColors.inputBorder),
                        ),
                        child: ListTile(
                          leading: MemberAvatar(
                            photoUrl: parent.photoUrl,
                            firstName: parent.firstName,
                            lastName: parent.lastName,
                          ),
                          title: Text(parent.fullName),
                          subtitle: Text(parent.memberId),
                          trailing: const Icon(Icons.touch_app_rounded),
                          onTap: () {
                            setState(() {
                              _selectedParent = parent;
                              _parentController.text = parent.fullName;
                              _parentResults = const <Member>[];
                            });
                          },
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
