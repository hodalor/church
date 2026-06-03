import 'package:flutter/material.dart';
import '../../core/utils/app_colors.dart';

const Set<String> kVisitorLeaderRoles = <String>{
  'head_pastor',
  'associate_pastor',
  'branch_pastor',
  'volunteer_leader',
  'care_leader',
};

const List<String> kVisitorStages = <String>[
  'new_visitor',
  'contacted',
  'second_visit',
  'connected',
  'assimilated',
  'converted',
  'inactive',
  'lost',
];

const List<String> kVisitorAgeGroups = <String>[
  'child',
  'youth',
  'adult',
  'senior',
];

const List<String> kVisitorInterests = <String>[
  'Choir',
  'Bible Study',
  'Youth Group',
  'Men Fellowship',
  'Women Fellowship',
  'Prayer Team',
  'Ushers',
  'Other',
];

const List<Map<String, String>> kVisitorHearAboutOptions = <Map<String, String>>[
  <String, String>{'value': 'friend', 'label': 'Friend'},
  <String, String>{'value': 'member_invite', 'label': 'Member Invite'},
  <String, String>{'value': 'social_media', 'label': 'Social Media'},
  <String, String>{'value': 'flyer', 'label': 'Flyer'},
  <String, String>{'value': 'walk_in', 'label': 'Walk-in'},
  <String, String>{'value': 'other', 'label': 'Other'},
];

const List<String> kFollowUpOutcomes = <String>[
  'no_answer',
  'spoke',
  'positive',
  'not_interested',
  'will_return',
];

bool isVisitorLeaderRole(String? role) => kVisitorLeaderRoles.contains(role);

String stageLabel(String stage) {
  switch (stage) {
    case 'new_visitor':
      return 'New Visitor';
    case 'second_visit':
      return 'Second Visit';
    default:
      return stage
          .split('_')
          .where((part) => part.isNotEmpty)
          .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
          .join(' ');
  }
}

Color stageColorFor(String stage) {
  switch (stage) {
    case 'contacted':
      return const Color(0xFF2563EB);
    case 'second_visit':
      return const Color(0xFF0F766E);
    case 'connected':
      return const Color(0xFF7C3AED);
    case 'assimilated':
      return AppColors.accent;
    case 'converted':
      return AppColors.success;
    case 'inactive':
      return const Color(0xFFD97706);
    case 'lost':
      return AppColors.danger;
    case 'new_visitor':
    default:
      return const Color(0xFF6B7280);
  }
}

Color stageBackgroundFor(String stage) => stageColorFor(stage).withValues(alpha: 0.12);

String formatVisitorDate(DateTime? value) {
  if (value == null) {
    return 'Date unavailable';
  }

  const months = <String>[
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return '${months[value.month - 1]} ${value.day}, ${value.year}';
}

IconData followUpMethodIcon(String method) {
  switch (method.toLowerCase()) {
    case 'sms':
      return Icons.sms_outlined;
    case 'whatsapp':
      return Icons.forum_outlined;
    case 'email':
      return Icons.email_outlined;
    case 'visit':
      return Icons.home_work_outlined;
    case 'call':
    default:
      return Icons.call_outlined;
  }
}

String followUpOutcomeLabel(String outcome) {
  switch (outcome) {
    case 'no_answer':
      return 'No Answer';
    case 'spoke':
      return 'Spoke';
    case 'positive':
      return 'Positive';
    case 'not_interested':
      return 'Not Interested';
    case 'will_return':
      return 'Will Return';
    default:
      return outcome.isEmpty ? 'Pending' : outcome;
  }
}
